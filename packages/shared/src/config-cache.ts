/**
 * Pluggable cache for merged config entries, keyed by config key.
 *
 * The API registers a Redis-backed adapter at startup so config reads are
 * shared across instances; without an adapter, reads always hit the database
 * (the previous behavior). Adapter failures are swallowed by the query layer,
 * so a cache outage degrades to database reads instead of breaking requests.
 */
export type ConfigCacheAdapter = {
  /** Returns the cached serialized configs found among the given keys. */
  getMany: (keys: string[]) => Promise<Map<string, string>>;
  /** Stores serialized configs with the given TTL. */
  setMany: (entries: Map<string, string>, ttlSeconds: number) => Promise<void>;
  /** Removes a key from the cache — called on every config write. */
  remove: (key: string) => Promise<void>;
};

/**
 * Bounds staleness for writes that bypass the cache (e.g. manual DB edits)
 * and for entries whose invalidation was lost to a cache outage.
 */
export const CONFIG_CACHE_TTL_SECONDS = 5 * 60;

let adapter: ConfigCacheAdapter | null = null;

export function setConfigCacheAdapter(cacheAdapter: ConfigCacheAdapter | null): void {
  adapter = cacheAdapter;
}

export function getConfigCacheAdapter(): ConfigCacheAdapter | null {
  return adapter;
}
