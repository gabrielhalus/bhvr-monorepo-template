import type { TokenCacheAdapter } from "~shared/token-cache";

import { setTokenCacheAdapter } from "~shared/token-cache";

import { getRedis } from "./redis";

const KEY_PREFIX = "token:";

/**
 * Registers a Redis-backed adapter for the shared token cache, so the
 * per-request session validation usually skips Postgres while revocation
 * stays instant (mutations invalidate the affected ids across instances).
 * No-op when REDIS_URL is not configured — lookups then always hit Postgres.
 * @returns Whether the cache was registered.
 */
export function registerTokenCache(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const adapter: TokenCacheAdapter = {
    async get(id) {
      return redis.get(KEY_PREFIX + id);
    },

    async set(id, value, ttlSeconds) {
      await redis.set(KEY_PREFIX + id, value, "EX", ttlSeconds);
    },

    async remove(ids) {
      await redis.del(ids.map(id => KEY_PREFIX + id));
    },
  };

  setTokenCacheAdapter(adapter);
  return true;
}
