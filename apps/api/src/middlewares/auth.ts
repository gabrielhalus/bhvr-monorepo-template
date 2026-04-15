import type { AppContext } from "@/utils/hono";
import type { ApiKey } from "~shared/types/db/api-keys.types";
import type { AccessToken } from "~shared/types/db/tokens.types";

import { password } from "bun";
import { getCookie, setCookie } from "hono/cookie";
import { verify } from "hono/jwt";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, getCookieSettings, getJwtSecret } from "@/lib/jwt";
import { factory } from "@/utils/hono";
import { getApiKeyByPrefix } from "~shared/queries/api-key.queries";
import { logTokenRefresh } from "~shared/queries/logs.queries";
import { deleteToken, getToken } from "~shared/queries/tokens.queries";
import { getUser } from "~shared/queries/users.queries";
import { apiKeySchema } from "~shared/schemas/api/api-keys.schemas";
import { AccessTokenSchema, RefreshTokenSchema } from "~shared/schemas/api/tokens.schemas";

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

    const user = await getUser(apiKeyCtx.userId, ["roles"]);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("sessionContext", { user, impersonator: undefined });

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

  const user = await getUser(decoded.sub, ["roles"]);

  if (!user) {
    setCookie(c, "accessToken", "", getCookieSettings("clear"));
    setCookie(c, "refreshToken", "", getCookieSettings("clear"));
    return c.json({ error: "Unauthorized" }, 401);
  }

  let impersonator: typeof user | undefined;
  if (decoded.impersonatorId) {
    const impersonatorUser = await getUser(decoded.impersonatorId, ["roles"]);
    impersonator = impersonatorUser ?? undefined;
  }

  c.set("sessionContext", { user, impersonator });

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
