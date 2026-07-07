/**
 * Pluggable cache for session token records, keyed by token id (jti).
 *
 * The auth middleware validates the session against the token record on every
 * request; the API registers a Redis-backed adapter at startup so that lookup
 * usually skips Postgres. Every token mutation invalidates the affected ids,
 * keeping revocation instant. Without an adapter — or when the cache is
 * unreachable — lookups fall back to the database (the previous behavior),
 * so losing Redis never weakens revocation.
 */
export type TokenCacheAdapter = {
  /** Returns the cached serialized token record, or null on a miss. */
  get: (id: string) => Promise<string | null>;
  /** Stores a serialized token record with the given TTL. */
  set: (id: string, value: string, ttlSeconds: number) => Promise<void>;
  /** Removes token records from the cache — called on every token mutation. */
  remove: (ids: string[]) => Promise<void>;
};

/**
 * Kept short on purpose: if an invalidation is lost to a cache outage, a
 * revoked session stays usable for at most this long.
 */
export const TOKEN_CACHE_TTL_SECONDS = 60;

let adapter: TokenCacheAdapter | null = null;

export function setTokenCacheAdapter(cacheAdapter: TokenCacheAdapter | null): void {
  adapter = cacheAdapter;
}

export function getTokenCacheAdapter(): TokenCacheAdapter | null {
  return adapter;
}
