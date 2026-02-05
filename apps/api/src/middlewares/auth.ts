import type { AppContext } from "@/utils/hono";
import type { AccessToken } from "~shared/types/db/tokens.types";

import { getCookie, setCookie } from "hono/cookie";
import { verify } from "hono/jwt";

import { getClientInfo } from "@/helpers/get-client-info";
import { env } from "@/lib/env";
import { createAccessToken, getCookieSettings } from "@/lib/jwt";
import { factory } from "@/utils/hono";
import { logTokenRefresh } from "~shared/queries/audit-logs.queries";
import { deleteToken, getToken } from "~shared/queries/tokens.queries";
import { getUser } from "~shared/queries/users.queries";
import { AccessTokenSchema, RefreshTokenSchema } from "~shared/schemas/api/tokens.schemas";

/**
 * Get the user from the JWT token and set the session context
 * Automatically refreshes the access token if it's expired but refresh token is valid
 * @param c - The context
 * @param next - The next middleware
 * @returns The user
 */
export const getSessionContext = factory.createMiddleware(async (c, next) => {
  const accessToken = getCookie(c, "accessToken");
  let decoded: AccessToken | null = null;

  try {
    if (accessToken) {
      const verified = await verify(accessToken, env.JWT_SECRET);
      decoded = AccessTokenSchema.parse(verified);
    } else {
      decoded = await attemptTokenRefresh(c);
    }
  } catch {
    decoded = await attemptTokenRefresh(c);
  }

  if (!decoded) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await getUser(decoded.sub, ["roles"]);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if this is an impersonation session
  let impersonator: typeof user | undefined;
  if (decoded.impersonatorId) {
    const impersonatorUser = await getUser(decoded.impersonatorId, ["roles"]);
    impersonator = impersonatorUser ?? undefined;
  }

  c.set("sessionContext", { user, impersonator });

  await next();
});

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
    const verified = await verify(refreshToken, env.JWT_SECRET);
    const decoded = RefreshTokenSchema.parse(verified);

    const tokenRecord = await getToken(decoded.jti);

    if (!tokenRecord || tokenRecord.expiresAt < new Date().toISOString() || tokenRecord.revokedAt) {
      if (decoded.jti) {
        await deleteToken(decoded.jti);
      }
      return null;
    }

    // Note: When refreshing, we don't preserve impersonation - it only lasts for the access token lifetime
    // This is a security feature to prevent long-running impersonation sessions
    const newAccessToken = await createAccessToken(decoded.sub);
    setCookie(c, "accessToken", newAccessToken, getCookieSettings("access"));

    const newVerified = await verify(newAccessToken, env.JWT_SECRET);
    const newDecoded = AccessTokenSchema.parse(newVerified);

    // Audit log: token refresh
    const clientInfo = getClientInfo(c);
    logTokenRefresh(decoded.sub, clientInfo).catch(() => {
      // Silently fail audit logging to not break auth flow
    });

    return newDecoded;
  } catch {
    return null;
  }
}
