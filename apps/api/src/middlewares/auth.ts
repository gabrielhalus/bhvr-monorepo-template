import type { AppContext, AppEnv } from "@/utils/hono";
import type { ApiKey } from "~shared/types/db/api-keys.types";
import type { AccessToken } from "~shared/types/db/tokens.types";
import type { OrgId } from "~shared/types/org.types";

import { password } from "bun";
import { getCookie, setCookie } from "hono/cookie";
import { verify } from "hono/jwt";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, getCookieSettings, getJwtSecret } from "@/lib/jwt";
import { factory } from "@/utils/hono";
import { getApiKeyByPrefix, recordApiKeyLastUsed } from "~shared/queries/api-key.queries";
import { logTokenRefresh } from "~shared/queries/logs.queries";
import { getMember } from "~shared/queries/organization-members.queries";
import { getOrganization } from "~shared/queries/organizations.queries";
import { deleteToken, getToken } from "~shared/queries/tokens.queries";
import { getUser, getUserOrgRoles, getUserPlatformRoles } from "~shared/queries/users.queries";
import { apiKeySchema } from "~shared/schemas/api/api-keys.schemas";
import { AccessTokenSchema, RefreshTokenSchema } from "~shared/schemas/api/tokens.schemas";

type SessionUser = AppEnv["Variables"]["sessionContext"]["user"];
type SessionMembership = AppEnv["Variables"]["sessionContext"]["membership"];

/**
 * Load a user with the roles that apply to the current surface:
 * - Org surface: the user's roles in that org (incl. the implicit default
 *   role) plus their platform roles. Non-members are rejected unless they
 *   hold a platform super-admin role (support access).
 * - Platform surface: platform roles only.
 * @returns The session user and membership, "not-member" when the user is
 * authenticated but may not access this organization, or null if the user
 * does not exist.
 */
async function buildSessionUser(c: AppContext, userId: string): Promise<{ user: SessionUser; membership?: SessionMembership } | "not-member" | null> {
  const orgContext = c.get("orgContext");

  const user = await getUser(userId);
  if (!user) {
    return null;
  }

  const platformRoles = await getUserPlatformRoles(userId);

  if (!orgContext) {
    return { user: { ...user, roles: platformRoles } };
  }

  const orgId = orgContext.org.id as OrgId;
  const membership = await getMember(orgId, userId) ?? undefined;
  const isPlatformSuperAdmin = platformRoles.some(role => role.isSuperAdmin);

  if (!membership && !isPlatformSuperAdmin) {
    return "not-member";
  }

  const orgRoles = membership ? await getUserOrgRoles(orgId, userId) : [];

  return { user: { ...user, roles: [...orgRoles, ...platformRoles] }, membership };
}

/**
 * Get the user from the JWT token and set the session context
 * Automatically refreshes the access token if it's expired but refresh token is valid
 * Always validates the session against the DB to ensure revoked tokens are rejected
 * @param c - The context
 * @param next - The next middleware
 * @returns The user
 */
export const getSessionContext = factory.createMiddleware(async (c, next) => {
  // =========================
  // API KEY AUTH
  // =========================
  const apiKey = c.req.header("x-api-key");

  if (apiKey) {
    const apiKeyCtx = await validateApiKey(apiKey);

    if (!apiKeyCtx) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // A key bound to an organization decides the org context — not the
    // caller's domain. Platform keys (organizationId null) keep the
    // domain-based resolution.
    if (apiKeyCtx.organizationId) {
      const keyOrg = await getOrganization(apiKeyCtx.organizationId);
      if (!keyOrg) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      c.set("orgContext", { org: keyOrg, domain: "api-key" });
    }

    const session = await buildSessionUser(c, apiKeyCtx.userId);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (session === "not-member") {
      // Authenticated but not a member of this organization — don't reveal it
      return c.json({ error: "Not Found" }, 404);
    }

    c.set("sessionContext", { user: session.user, membership: session.membership, impersonator: undefined });

    return next();
  }

  // =========================
  // JWT AUTH
  // =========================

  const accessToken = getCookie(c, "accessToken");
  let decoded: AccessToken | null = null;

  try {
    if (accessToken) {
      const verified = await verify(accessToken, await getJwtSecret());
      decoded = AccessTokenSchema.parse(verified);

      const refreshToken = getCookie(c, "refreshToken");
      if (refreshToken) {
        try {
          const refreshVerified = await verify(refreshToken, await getJwtSecret());
          const refreshDecoded = RefreshTokenSchema.parse(refreshVerified);
          const tokenRecord = await getToken(refreshDecoded.jti);
          if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date().toISOString()) {
            decoded = null;
          }
        } catch {
          decoded = null;
        }
      } else {
        decoded = null;
      }
    } else {
      decoded = await attemptTokenRefresh(c);
    }
  } catch {
    decoded = await attemptTokenRefresh(c);
  }

  if (!decoded) {
    setCookie(c, "accessToken", "", getCookieSettings("clear"));
    setCookie(c, "refreshToken", "", getCookieSettings("clear"));
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await buildSessionUser(c, decoded.sub);

  if (!session) {
    setCookie(c, "accessToken", "", getCookieSettings("clear"));
    setCookie(c, "refreshToken", "", getCookieSettings("clear"));
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (session === "not-member") {
    // Authenticated but not a member of this organization — don't reveal it
    return c.json({ error: "Not Found" }, 404);
  }

  let impersonator: SessionUser | undefined;
  if (decoded.impersonatorId) {
    const impersonatorSession = await buildSessionUser(c, decoded.impersonatorId);
    impersonator = typeof impersonatorSession === "object" && impersonatorSession !== null ? impersonatorSession.user : undefined;
  }

  c.set("sessionContext", { user: session.user, membership: session.membership, impersonator });

  await next();
});

/**
 * Validates an API key by checking its format, existence, and secret hash.
 * @param rawKey - The raw API key to validate (must be prefixed with "sk_")
 * @returns The matching if valid, or `null` if not found, revoked, or invalid
 */
async function validateApiKey(rawKey: string): Promise<ApiKey | null> {
  if (!rawKey.startsWith("sk_")) {
    return null;
  }

  const parsed = apiKeySchema.safeParse(rawKey);
  if (!parsed.success) {
    return null;
  }

  const { prefix, secret } = parsed.data;
  const apiKey = await getApiKeyByPrefix(prefix);

  if (!apiKey || apiKey.revokedAt) {
    return null;
  }

  const isValid = await password.verify(secret, apiKey.secretHash);

  recordApiKeyLastUsed(apiKey.id);
  return isValid ? apiKey : null;
}

/**
 * Attempt to refresh the access token using the refresh token
 * @param c - The context
 * @returns The decoded access token payload or null if refresh failed
 */
async function attemptTokenRefresh(c: AppContext): Promise<AccessToken | null> {
  const refreshToken = getCookie(c, "refreshToken");

  if (!refreshToken) {
    return null;
  }

  try {
    const verified = await verify(refreshToken, await getJwtSecret());
    const decoded = RefreshTokenSchema.parse(verified);

    const tokenRecord = await getToken(decoded.jti);

    if (!tokenRecord || tokenRecord.expiresAt < new Date().toISOString() || tokenRecord.revokedAt) {
      if (decoded.jti) {
        await deleteToken(decoded.jti);
      }
      return null;
    }

    const newAccessToken = await createAccessToken(decoded.sub);
    setCookie(c, "accessToken", newAccessToken, getCookieSettings("access"));

    const newVerified = await verify(newAccessToken, await getJwtSecret());
    const newDecoded = AccessTokenSchema.parse(newVerified);

    const clientInfo = getClientInfo(c);
    logTokenRefresh(decoded.sub, clientInfo).catch(() => {});

    return newDecoded;
  } catch {
    return null;
  }
}
