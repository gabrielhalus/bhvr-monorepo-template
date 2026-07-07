import type { RoleCacheAdapter } from "~shared/role-cache";

import { setRoleCacheAdapter } from "~shared/role-cache";

import { getRedis } from "./redis";

const KEY_PREFIX = "role-auth:";

/**
 * Registers a Redis-backed adapter for the shared role cache, so permission
 * checks hydrate role permissions and policies from Redis instead of Postgres.
 * No-op when REDIS_URL is not configured — hydration then always hits Postgres.
 * @returns Whether the cache was registered.
 */
export function registerRoleCache(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const adapter: RoleCacheAdapter = {
    async getMany(roleIds) {
      const values = await redis.mget(roleIds.map(id => KEY_PREFIX + id));
      const hits = new Map<number, string>();
      roleIds.forEach((roleId, i) => {
        const value = values[i];
        if (value !== null && value !== undefined) {
          hits.set(roleId, value);
        }
      });
      return hits;
    },

    async setMany(entries, ttlSeconds) {
      const pipeline = redis.pipeline();
      for (const [roleId, value] of entries) {
        pipeline.set(KEY_PREFIX + roleId, value, "EX", ttlSeconds);
      }
      await pipeline.exec();
    },

    async remove(roleIds) {
      await redis.del(roleIds.map(id => KEY_PREFIX + id));
    },
  };

  setRoleCacheAdapter(adapter);
  return true;
}
