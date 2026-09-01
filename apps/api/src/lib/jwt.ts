import type { CookieType } from "./types";
import type { JwtPayload } from "~shared/types/db/tokens.types";
import type { Context } from "hono";

import { sign, verify } from "hono/jwt";

import { isSecureRequest } from "@/lib/trusted-proxy";
import { getConfig } from "~shared/queries/configs.queries";

export async function getJwtSecret(): Promise<string> {
  const config = await getConfig("authentication.jwt.secret");
  if (config?.value) return config.value;
  throw new Error("JWT secret is not configured. Run bootstrap to initialize it.");
}

export const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 15; // 15 minutes
export const REFRESH_TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const VERIFICATION_TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24; // 1 day
export const OAUTH_FLOW_EXPIRATION_SECONDS = 60 * 10; // 10 minutes

/**
 * Create an access token.
 * @param userId - The user ID to create the token for.
 * @param impersonatorId - Optional ID of the user who is impersonating.
 * @returns The access token.
 */
export async function createAccessToken(userId: string, impersonatorId?: string): Promise<string> {
  const payload: JwtPayload = {
    sub: userId,
    ttyp: "access",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRATION_SECONDS,
    iss: "bunstack",
    ...(impersonatorId && { impersonatorId }),
  };

  return await sign(payload, await getJwtSecret());
}

/**
 * Create a refresh token.
 * @param userId - The user ID to create the token for.
 * @param jti - The ID of the database record to associate with the token.
 * @returns The refresh token.
 */
export async function createRefreshToken(userId: string, jti: string): Promise<string> {
  const payload: JwtPayload = {
    sub: userId,
    jti,
    ttyp: "refresh",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRATION_SECONDS,
    iss: "bunstack",
  };

  return await sign(payload, await getJwtSecret());
}

/**
 * Create a verification token.
 * @param userId - The user ID to create the token for.
 * @param jti - The ID of the database record to associate with the token.
 * @returns The verification token.
 */
export async function createVerificationToken(userId: string, jti: string): Promise<string> {
  const payload: JwtPayload = {
    sub: userId,
    jti,
    ttyp: "verification",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + VERIFICATION_TOKEN_EXPIRATION_SECONDS,
    iss: "bunstack",
  };

  return await sign(payload, await getJwtSecret());
}

/**
 * Verify a token.
 * @param token - The token to verify.
 * @param type - The type of token to verify.
 * @returns The payload of the token.
 * @returns null if the token is invalid.
 */
export async function verifyToken<T extends JwtPayload["ttyp"]>(token: string, type: T): Promise<Extract<JwtPayload, { ttyp: T }> | null> {
  const payload = await verify(token, await getJwtSecret()) as JwtPayload;
  return payload.ttyp === type ? payload as Extract<JwtPayload, { ttyp: T }> : null;
}

/**
 * Get the settings for a cookie.
 *
 * The SPA and this API are served from a single origin (the proxy routes
 * `/api` here), so the cookie is deliberately **host-only**: no `Domain`
 * attribute. A `Domain` only makes sense to share a cookie across subdomains,
 * and browsers reject one built from a bare IP or a single-label host —
 * setting it broke sign-in on `http://192.168.x.x` and `http://localhost`.
 *
 * `SameSite=Lax` is enough here and blocks the cross-site POSTs that
 * `SameSite=None` used to allow. The OAuth callback still works: it is a
 * top-level GET navigation, which Lax cookies accompany.
 *
 * `Secure` follows the scheme the browser actually used, so a plain-HTTP LAN
 * deployment works while an HTTPS one keeps the flag.
 *
 * @param c - The Hono context object
 * @param type - The type of cookie to get the settings for.
 * @returns The settings for the cookie.
 * @throws An error if the cookie type is invalid.
 */
export function getCookieSettings(c: Context, type: CookieType) {
  const base = {
    httpOnly: true,
    path: "/",
    secure: isSecureRequest(c),
    sameSite: "lax" as const,
  };

  switch (type) {
    case "access":
      return { ...base, maxAge: Number(ACCESS_TOKEN_EXPIRATION_SECONDS) };
    case "refresh":
      return { ...base, maxAge: Number(REFRESH_TOKEN_EXPIRATION_SECONDS) };
    case "oauth":
      return { ...base, maxAge: Number(OAUTH_FLOW_EXPIRATION_SECONDS) };
    case "clear":
      return { ...base, maxAge: 0, expires: new Date(0) };
    default:
      throw new Error(`Invalid cookie type: ${type}`);
  }
}
