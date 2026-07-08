import type { OrgCacheAdapter } from "~shared/org-cache";

import { setOrgCacheAdapter } from "~shared/org-cache";

import { getRedis } from "./redis";

const KEY_PREFIX = "org-domain:";

/**
 * Registers a Redis-backed adapter for the shared org resolution cache, so
 * domain → organization lookups are served from Redis instead of Postgres.
 * No-op when REDIS_URL is not configured — resolution then always hits Postgres.
 * @returns Whether the cache was registered.
 */
export function registerOrgCache(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const adapter: OrgCacheAdapter = {
    async get(hostname) {
      return redis.get(KEY_PREFIX + hostname);
    },

    async set(hostname, value, ttlSeconds) {
      await redis.set(KEY_PREFIX + hostname, value, "EX", ttlSeconds);
    },

    async remove(hostnames) {
      if (hostnames.length > 0) {
        await redis.del(hostnames.map(h => KEY_PREFIX + h));
      }
    },
  };

  setOrgCacheAdapter(adapter);
  return true;
}
