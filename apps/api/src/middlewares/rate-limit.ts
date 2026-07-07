import type { Context, Next } from "hono";
import type { Redis } from "ioredis";

import { getRedis } from "@/lib/redis";

type HitResult = { count: number; resetAt: number };

type RateLimitOptions = {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /**
   * Namespace for the counters. Middlewares sharing a name share their
   * counters (across instances when Redis is configured). Defaults to
   * `{limit}:{windowMs}`.
   */
  name?: string;
  /** Key generator function to identify clients (defaults to IP address) */
  keyGenerator?: (c: Context) => string;
  /** Message to return when rate limit is exceeded */
  message?: string;
};

/**
 * Atomically increments a counter and sets its expiry on first hit.
 * Returns [count, remaining TTL in ms].
 */
const REDIS_HIT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return { count, redis.call("PTTL", KEYS[1]) }
`;

async function redisHit(redis: Redis, key: string, windowMs: number): Promise<HitResult> {
  const [count, ttl] = await redis.eval(REDIS_HIT_SCRIPT, 1, key, String(windowMs)) as [number, number];
  return { count, resetAt: Date.now() + (ttl > 0 ? ttl : windowMs) };
}

type MemoryStore = { hit: (key: string) => HitResult };

function createMemoryStore(windowMs: number): MemoryStore {
  const store = new Map<string, HitResult>();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now >= value.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs);

  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return {
    hit(key) {
      const now = Date.now();
      let record = store.get(key);

      if (!record || now >= record.resetAt) {
        record = { count: 1, resetAt: now + windowMs };
        store.set(key, record);
      } else {
        record.count++;
      }

      return record;
    },
  };
}

/**
 * Creates a rate limiting middleware for Hono
 *
 * Counters live in Redis when REDIS_URL is configured, making limits
 * consistent across instances. Without Redis (or when it is unreachable),
 * falls back to a per-process in-memory store.
 *
 * @param options - Rate limiting configuration
 * @returns Hono middleware function
 *
 * @example Allow 5 login attempts per minute
 * app.post("/login", rateLimiter({ limit: 5, windowMs: 60 * 1000 }), handler)
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    limit,
    windowMs,
    name = `${limit}:${windowMs}`,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later",
  } = options;

  const memoryStore = createMemoryStore(windowMs);

  return async (c: Context, next: Next) => {
    const clientKey = keyGenerator(c);
    const redis = getRedis();

    let record: HitResult;
    if (redis) {
      try {
        record = await redisHit(redis, `rate-limit:${name}:${clientKey}`, windowMs);
      } catch (error) {
        console.error(`[Rate limit] Redis unavailable, using in-memory fallback: ${error instanceof Error ? error.message : error}`);
        record = memoryStore.hit(clientKey);
      }
    } else {
      record = memoryStore.hit(clientKey);
    }

    const remaining = Math.max(0, limit - record.count);
    const resetTime = Math.ceil((record.resetAt - Date.now()) / 1000);

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetTime));

    if (record.count > limit) {
      c.header("Retry-After", String(resetTime));
      return c.json({ success: false as const, error: message }, 429);
    }

    await next();
  };
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(c: Context): string {
  // Try various headers for IP address (handles proxies)
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    return firstIp?.trim() ?? "unknown";
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default key if no IP available
  return "unknown";
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  login: { name: "login", limit: 10, windowMs: 15 * 60 * 1000 },
  register: { name: "register", limit: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { name: "forgot-password", limit: 10, windowMs: 60 * 60 * 1000 },
  resetPassword: { name: "reset-password", limit: 15, windowMs: 60 * 60 * 1000 },
  oauthStart: { name: "oauth-start", limit: 20, windowMs: 15 * 60 * 1000 },
  api: { name: "api", limit: 300, windowMs: 60 * 1000 },
} as const;
