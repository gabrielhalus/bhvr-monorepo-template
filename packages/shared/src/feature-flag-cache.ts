/**
 * Pluggable cache for resolved feature flag maps, keyed by organization id
 * (or "platform" for the platform-wide view). The API registers a
 * Redis-backed adapter at startup; without one — or when the cache is
 * unreachable — resolution falls back to the database.
 */
export type FeatureFlagCacheAdapter = {
  /** Returns the cached serialized flag map for a scope key, if any. */
  get: (scopeKey: string) => Promise<string | null>;
  /** Stores a serialized flag map with the given TTL. */
  set: (scopeKey: string, value: string, ttlSeconds: number) => Promise<void>;
  /** Removes scope entries from the cache — called when overrides change. */
  remove: (scopeKeys: string[]) => Promise<void>;
};

export const FEATURE_FLAG_CACHE_TTL_SECONDS = 5 * 60;

let adapter: FeatureFlagCacheAdapter | null = null;

export function setFeatureFlagCacheAdapter(cacheAdapter: FeatureFlagCacheAdapter | null): void {
  adapter = cacheAdapter;
}

export function getFeatureFlagCacheAdapter(): FeatureFlagCacheAdapter | null {
  return adapter;
}
