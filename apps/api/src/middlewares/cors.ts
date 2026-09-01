import type { MiddlewareHandler } from "hono";

import { cors } from "hono/cors";
import { ENV } from "varlock/env";

/**
 * The CORS middleware.
 *
 * Same-origin by default: the SPA is served behind the same proxy as this API
 * (`/api` routes here), so no browser request is ever cross-origin and no CORS
 * header is needed. Emitting none is the safe default — the browser then
 * refuses any cross-origin read.
 *
 * `ALLOWED_ORIGINS` opts into a split-domain deployment. Origins are matched in
 * full (scheme + host + port); the previous hostname-suffix match extended
 * credentialed access to every subdomain, so a single subdomain takeover was
 * enough to read authenticated responses.
 *
 * @returns The CORS middleware.
 */
export default function (): MiddlewareHandler {
  const allowed = (ENV.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (allowed.length === 0) {
    return async (_c, next) => {
      await next();
    };
  }

  return cors({
    origin: origin => (origin && allowed.includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}
