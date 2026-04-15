import type { CookieType } from "./types";
import type { JwtPayload } from "~shared/types/db/tokens.types";

import { sign, verify } from "hono/jwt";
import { ENV } from "varlock/env";
import { getConfig } from "~shared/queries/configs.queries";

export async function getJwtSecret(): Promise<string> {
  const config = await getConfig("security.jwt.secret");
  if (config?.value) return config.value;
  throw new Error("JWT secret is not configured. Run bootstrap to initialize it.");
}

export const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 15; // 15 minutes
export const REFRESH_TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const VERIFICATION_TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24; // 1 day

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
 * @param type - The type of cookie to get the settings for.
 * @returns The settings for the cookie.
 * @throws An error if the cookie type is invalid.
 */
export function getCookieSettings(type: CookieType) {
  const isProd = ENV.APP_ENV === "production";

  const isSubdomainDev = !isProd && ENV.APP_HOST?.endsWith(".localhost.dev");

  const base = {
    httpOnly: true,
    path: "/",
    domain: isProd
      ? `.${ENV.APP_HOST}` // prod: example.com → .example.com
      : isSubdomainDev
        ? `.${ENV.APP_HOST}` // dev subdomains → .localhost.dev
        : undefined, // real dev with ports → no domain, host-only
    secure: isProd || isSubdomainDev, // must be true for SameSite=None
    sameSite: isProd || isSubdomainDev ? "none" as const : "lax" as const,
  };

  switch (type) {
    case "access":
      return { ...base, maxAge: Number(ACCESS_TOKEN_EXPIRATION_SECONDS) };
    case "refresh":
      return { ...base, maxAge: Number(REFRESH_TOKEN_EXPIRATION_SECONDS) };
    case "clear":
      return { ...base, maxAge: 0, expires: new Date(0) };
    default:
      throw new Error(`Invalid cookie type: ${type}`);
  }
}
