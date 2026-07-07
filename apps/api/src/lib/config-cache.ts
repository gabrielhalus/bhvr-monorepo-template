import type { ConfigCacheAdapter } from "~shared/config-cache";

import { setConfigCacheAdapter } from "~shared/config-cache";

import { getRedis } from "./redis";

const KEY_PREFIX = "config:";

/**
 * Registers a Redis-backed adapter for the shared config cache, making config
 * reads shared across API instances with write-through invalidation.
 * No-op when REDIS_URL is not configured — reads then always hit Postgres.
 * @returns Whether the cache was registered.
 */
export function registerConfigCache(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const adapter: ConfigCacheAdapter = {
    async getMany(keys) {
      const values = await redis.mget(keys.map(key => KEY_PREFIX + key));
      const hits = new Map<string, string>();
      keys.forEach((key, i) => {
        const value = values[i];
        if (value !== null && value !== undefined) {
          hits.set(key, value);
        }
      });
      return hits;
    },

    async setMany(entries, ttlSeconds) {
      const pipeline = redis.pipeline();
      for (const [key, value] of entries) {
        pipeline.set(KEY_PREFIX + key, value, "EX", ttlSeconds);
      }
      await pipeline.exec();
    },

    async remove(key) {
      await redis.del(KEY_PREFIX + key);
    },
  };

  setConfigCacheAdapter(adapter);
  return true;
}
