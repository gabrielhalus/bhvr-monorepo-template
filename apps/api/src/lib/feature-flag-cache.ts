import type { FeatureFlagCacheAdapter } from "~shared/feature-flag-cache";

import { setFeatureFlagCacheAdapter } from "~shared/feature-flag-cache";

import { getRedis } from "./redis";

const KEY_PREFIX = "feature-flags:";

/**
 * Registers a Redis-backed adapter for the shared feature flag cache, so
 * flag resolution is served from Redis instead of Postgres.
 * No-op when REDIS_URL is not configured — resolution then always hits Postgres.
 * @returns Whether the cache was registered.
 */
export function registerFeatureFlagCache(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const adapter: FeatureFlagCacheAdapter = {
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

  setFeatureFlagCacheAdapter(adapter);
  return true;
}
