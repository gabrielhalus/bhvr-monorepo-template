import type { MiddlewareHandler } from "hono";

import { cors } from "hono/cors";
import { ENV } from "varlock/env";

/**
 * The CORS middleware.
 * @returns The CORS middleware.
 */
export default function (): MiddlewareHandler {
  return cors({
    origin: (originHeader) => {
      if (!originHeader) {
        return null;
      }

      const url = new URL(originHeader);
      return url.hostname === ENV.APP_HOST || url.hostname.endsWith(`.${ENV.APP_HOST}`) ? originHeader : null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}
