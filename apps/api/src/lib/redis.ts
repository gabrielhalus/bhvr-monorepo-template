import { Redis } from "ioredis";
import { ENV } from "varlock/env";

let client: Redis | null | undefined;

export function getRedisUrl(): string | undefined {
  try {
    return ENV.REDIS_URL;
  } catch {
    // varlock not initialized (e.g. unit tests) — treat Redis as unconfigured
    return undefined;
  }
}

/**
 * Shared Redis connection, or null when REDIS_URL is not configured.
 *
 * Tuned for request-path usage: commands fail fast instead of queueing while
 * the connection is down, so callers can degrade gracefully (e.g. the rate
 * limiter falls back to its in-memory store).
 *
 * Note for future BullMQ workers: they need a dedicated connection with
 * `maxRetriesPerRequest: null` — do not reuse this one.
 */
export function getRedis(): Redis | null {
  if (client === undefined) {
    const redisUrl = getRedisUrl();
    if (redisUrl) {
      client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      // ioredis emits "error" on every failed (re)connect attempt; without a
      // listener those become uncaught exceptions and crash the process.
      client.on("error", (error) => {
        console.error(`[Redis] ${error.message}`);
      });
    } else {
      client = null;
    }
  }
  return client;
}
