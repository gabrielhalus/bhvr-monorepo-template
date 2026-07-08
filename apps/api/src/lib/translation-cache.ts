import type { TranslationCacheAdapter } from "~shared/translation-cache";

import { setTranslationCacheAdapter } from "~shared/translation-cache";

import { getRedis } from "./redis";

const KEY_PREFIX = "org-i18n:";

/**
 * Registers a Redis-backed adapter for the shared translation override cache.
 * No-op when REDIS_URL is not configured — resolution then always hits Postgres.
 * @returns Whether the cache was registered.
 */
export function registerTranslationCache(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const adapter: TranslationCacheAdapter = {
    async get(scopeKey) {
      return redis.get(KEY_PREFIX + scopeKey);
    },

    async set(scopeKey, value, ttlSeconds) {
      await redis.set(KEY_PREFIX + scopeKey, value, "EX", ttlSeconds);
    },

    async remove(scopeKeys) {
      if (scopeKeys.length > 0) {
        await redis.del(scopeKeys.map(k => KEY_PREFIX + k));
      }
    },
  };

  setTranslationCacheAdapter(adapter);
  return true;
}
