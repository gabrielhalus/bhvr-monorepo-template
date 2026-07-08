import type { MiddlewareHandler } from "hono";

import { cors } from "hono/cors";
import { ENV } from "varlock/env";

import { getOrgCacheAdapter } from "~shared/org-cache";
import { getOrganizationIdByDomain } from "~shared/queries/organization-domains.queries";

/**
 * The CORS middleware. Allows:
 * - APP_HOST entries and their subdomains (dev hosts),
 * - BASE_DOMAIN, admin.BASE_DOMAIN and every {slug}.BASE_DOMAIN — unknown
 *   subdomains are safe to allow because org resolution 404s them,
 * - verified custom org domains (cache first, database fallback).
 * @returns The CORS middleware.
 */
export default function (): MiddlewareHandler {
  const hosts = ENV.APP_HOST.split(",").map(h => h.trim().toLowerCase());
  const baseDomain = (ENV.BASE_DOMAIN.split(":")[0] ?? ENV.BASE_DOMAIN).toLowerCase();

  return cors({
    origin: async (originHeader) => {
      if (!originHeader) {
        return null;
      }

      let hostname: string;
      try {
        hostname = new URL(originHeader).hostname.toLowerCase();
      } catch {
        return null;
      }

      const isKnownHost = [...hosts, baseDomain].some(
        host => hostname === host || hostname.endsWith(`.${host}`),
      );
      if (isKnownHost) {
        return originHeader;
      }

      // Custom org domain — resolution cache first, verified rows only
      try {
        if (await getOrgCacheAdapter()?.get(hostname)) {
          return originHeader;
        }
      } catch {
        // Cache unavailable — fall through to the database
      }

      return await getOrganizationIdByDomain(hostname) ? originHeader : null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}
