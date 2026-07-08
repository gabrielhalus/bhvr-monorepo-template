/**
 * Pluggable cache for per-organization translation overrides, keyed by
 * "{orgId}:{locale}". The API registers a Redis-backed adapter at startup;
 * without one — or when the cache is unreachable — resolution falls back to
 * the database.
 */
export type TranslationCacheAdapter = {
  /** Returns the cached serialized override bundle for a scope key, if any. */
  get: (scopeKey: string) => Promise<string | null>;
  /** Stores a serialized override bundle with the given TTL. */
  set: (scopeKey: string, value: string, ttlSeconds: number) => Promise<void>;
  /** Removes scope entries from the cache — called when overrides change. */
  remove: (scopeKeys: string[]) => Promise<void>;
};

export const TRANSLATION_CACHE_TTL_SECONDS = 5 * 60;

let adapter: TranslationCacheAdapter | null = null;

export function setTranslationCacheAdapter(cacheAdapter: TranslationCacheAdapter | null): void {
  adapter = cacheAdapter;
}

export function getTranslationCacheAdapter(): TranslationCacheAdapter | null {
  return adapter;
}
