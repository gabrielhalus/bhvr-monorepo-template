/**
 * Pluggable cache for domain → organization resolution, keyed by hostname.
 *
 * Every request resolves its organization from the Host/Origin hostname; the
 * API registers a Redis-backed adapter at startup so resolution usually skips
 * Postgres. Entries are invalidated when domains or organizations change; the
 * TTL covers out-of-band edits. Without an adapter — or when the cache is
 * unreachable — resolution falls back to the database.
 */
export type OrgCacheAdapter = {
  /** Returns the cached serialized organization for a hostname, if any. */
  get: (hostname: string) => Promise<string | null>;
  /** Stores a serialized organization for a hostname with the given TTL. */
  set: (hostname: string, value: string, ttlSeconds: number) => Promise<void>;
  /** Removes hostname entries from the cache. */
  remove: (hostnames: string[]) => Promise<void>;
};

export const ORG_CACHE_TTL_SECONDS = 5 * 60;

let adapter: OrgCacheAdapter | null = null;

export function setOrgCacheAdapter(cacheAdapter: OrgCacheAdapter | null): void {
  adapter = cacheAdapter;
}

export function getOrgCacheAdapter(): OrgCacheAdapter | null {
  return adapter;
}
