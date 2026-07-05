import type { Context } from "hono";

import { setCookie } from "hono/cookie";

import { getClientInfo } from "@/helpers/get-client-info";
import { createAccessToken, createRefreshToken, getCookieSettings, REFRESH_TOKEN_EXPIRATION_SECONDS } from "@/lib/jwt";
import { insertToken } from "~shared/queries/tokens.queries";

/**
 * Open a session for a user: persist a refresh token record and set the
 * access/refresh cookies on the response.
 *
 * @param c - The Hono context object
 * @param userId - The user to open the session for
 */
export async function issueSession(c: Context, userId: string) {
  const clientInfo = getClientInfo(c);

  const insertedToken = await insertToken({
    userId,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
    ...clientInfo,
  });

  const accessToken = await createAccessToken(userId);
  setCookie(c, "accessToken", accessToken, getCookieSettings("access"));

  const refreshToken = await createRefreshToken(userId, insertedToken.id);
  setCookie(c, "refreshToken", refreshToken, getCookieSettings("refresh"));
}
