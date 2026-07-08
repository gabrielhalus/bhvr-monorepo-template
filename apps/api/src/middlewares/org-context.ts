import type { Organization } from "~shared/types/db/organizations.types";
import type { Context } from "hono";

import { ENV } from "varlock/env";

import { factory } from "@/utils/hono";
import { getOrgCacheAdapter, ORG_CACHE_TTL_SECONDS } from "~shared/org-cache";
import { getOrganizationIdByDomain } from "~shared/queries/organization-domains.queries";
import { getOrganization, getOrganizationBySlug } from "~shared/queries/organizations.queries";

export type OrgContext = {
  org: Organization;
  /** The hostname the request was resolved from */
  domain: string;
} | null;

/** Base domain the tenant apps are served under, without port (dev: lvh.me). */
export const BASE_DOMAIN = (ENV.BASE_DOMAIN.split(":")[0] ?? ENV.BASE_DOMAIN).toLowerCase();

/** Hostname of the platform admin app. */
export const ADMIN_DOMAIN = `admin.${BASE_DOMAIN}`;

/** Hostname of the API itself — direct browser navigations (OAuth) land here. */
const API_HOST = new URL(ENV.API_URL).hostname.toLowerCase();

const DEFAULT_ORG_SLUG = "default";

const isProd = ENV.APP_ENV === "production";
const appHosts = ENV.APP_HOST.split(",").map(h => h.trim().toLowerCase());

/**
 * Extract the hostname the request is addressed to: the Origin header when
 * present (browser cross-origin calls), else X-Forwarded-Host (proxies), else
 * Host. Lowercased, port stripped.
 */
function resolveHostname(c: Context): string | null {
  const origin = c.req.header("origin");
  if (origin) {
    try {
      return new URL(origin).hostname.toLowerCase();
    } catch {
      // Malformed Origin — fall through to Host
    }
  }

  const forwardedHost = c.req.header("x-forwarded-host") ?? c.req.header("host");
  if (!forwardedHost) {
    return null;
  }

  return (forwardedHost.split(",")[0] ?? forwardedHost).trim().replace(/:\d+$/, "").toLowerCase();
}

async function readOrgCache(hostname: string): Promise<Organization | null> {
  const cache = getOrgCacheAdapter();
  if (!cache) return null;

  try {
    const cached = await cache.get(hostname);
    return cached ? JSON.parse(cached) as Organization : null;
  } catch {
    // Cache unavailable or corrupt entry — fall back to the database
    return null;
  }
}

function writeOrgCache(hostname: string, org: Organization): void {
  getOrgCacheAdapter()?.set(hostname, JSON.stringify(org), ORG_CACHE_TTL_SECONDS).catch(() => {});
}

/**
 * Drop hostnames from the resolution cache after a domain or organization
 * mutation. Unreachable cache entries expire via TTL.
 */
export async function invalidateOrgDomains(hostnames: string[]): Promise<void> {
  try {
    await getOrgCacheAdapter()?.remove(hostnames.map(h => h.toLowerCase()));
  } catch {
    // Stale entries expire via TTL
  }
}

/**
 * Classify a hostname: the platform surface (admin app, bare base domain,
 * the API's own host), an organization's domain, the default org for dev
 * hosts outside production, or unknown.
 */
export async function classifyHostname(hostname: string): Promise<"platform" | Organization | null> {
  // Dev fallback first: in development the API and the tenant app often share
  // "localhost", so the APP_HOST → default-org mapping must win over the
  // API_HOST platform check (in production the two never collide).
  if (!isProd && appHosts.includes(hostname) && hostname !== ADMIN_DOMAIN && hostname !== BASE_DOMAIN) {
    return await getOrganizationBySlug(DEFAULT_ORG_SLUG) ?? "platform";
  }

  if (hostname === ADMIN_DOMAIN || hostname === BASE_DOMAIN || hostname === API_HOST) {
    return "platform";
  }

  return resolveOrganization(hostname);
}

/**
 * Resolve a hostname to an organization, or null when the host is unknown.
 */
async function resolveOrganization(hostname: string): Promise<Organization | null> {
  const cached = await readOrgCache(hostname);
  if (cached) {
    return cached;
  }

  let org: Organization | null = null;

  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    // Subdomain fast path: {slug}.BASE_DOMAIN (nested subdomains don't resolve)
    const slug = hostname.slice(0, -(BASE_DOMAIN.length + 1));
    org = slug.includes(".") ? null : await getOrganizationBySlug(slug);
  } else {
    // Custom domain: only verified rows resolve
    const orgId = await getOrganizationIdByDomain(hostname);
    org = orgId ? await getOrganization(orgId) : null;
  }

  if (org) {
    writeOrgCache(hostname, org);
  }

  return org;
}

/**
 * Resolve the organization the request is addressed to.
 *
 * - `admin.BASE_DOMAIN` and the bare `BASE_DOMAIN` are the platform surface
 *   (`orgContext = null`).
 * - `{slug}.BASE_DOMAIN` and verified custom domains resolve to their org.
 * - Unknown hosts get a 404 without revealing whether an org exists.
 * - Outside production, hosts listed in APP_HOST (e.g. localhost) resolve to
 *   the default organization so direct API access keeps working in dev.
 *
 * An API key bound to an organization overrides this resolution in the auth
 * middleware — the key, not the caller's domain, decides the org.
 */
export const resolveOrgContext = factory.createMiddleware(async (c, next) => {
  const hostname = resolveHostname(c);

  if (!hostname) {
    return c.json({ success: false, error: "Not Found" }, 404);
  }

  const classified = await classifyHostname(hostname);

  if (classified === "platform") {
    c.set("orgContext", null);
    return next();
  }

  if (!classified) {
    return c.json({ success: false, error: "Not Found" }, 404);
  }

  c.set("orgContext", { org: classified, domain: hostname });

  await next();
});
