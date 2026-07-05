import type { MiddlewareHandler } from "hono";

import { cors } from "hono/cors";
import { ENV } from "varlock/env";

/**
 * The CORS middleware.
 * @returns The CORS middleware.
 */
export default function (): MiddlewareHandler {
  const hosts = ENV.APP_HOST.split(",").map(h => h.trim());

  return cors({
    origin: (originHeader) => {
      if (!originHeader) {
        return null;
      }

      const url = new URL(originHeader);
      const isAllowed = hosts.some(
        host => url.hostname === host || url.hostname.endsWith(`.${host}`),
      );
      return isAllowed ? originHeader : null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}
