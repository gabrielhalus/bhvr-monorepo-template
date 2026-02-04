import type { Context, Next } from "hono";

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

type RateLimitOptions = {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key generator function to identify clients (defaults to IP address) */
  keyGenerator?: (c: Context) => string;
  /** Message to return when rate limit is exceeded */
  message?: string;
};

const stores = new Map<string, RateLimitStore>();

/**
 * Creates a rate limiting middleware for Hono
 *
 * @param options - Rate limiting configuration
 * @returns Hono middleware function
 *
 * @example
 * // Allow 5 login attempts per minute
 * app.post("/login", rateLimiter({ limit: 5, windowMs: 60 * 1000 }), handler)
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    limit,
    windowMs,
    keyGenerator = defaultKeyGenerator,
    message = "Too many requests, please try again later",
  } = options;

  // Create a unique store for this limiter instance
  const storeKey = `${limit}-${windowMs}-${Math.random()}`;
  const store: RateLimitStore = new Map();
  stores.set(storeKey, store);

  // Cleanup expired entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now >= value.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs);

  // Allow cleanup to be garbage collected when the process exits
  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    let record = store.get(key);

    // If no record exists or window has expired, create new record
    if (!record || now >= record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      store.set(key, record);
    } else {
      record.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, limit - record.count);
    const resetTime = Math.ceil((record.resetAt - now) / 1000);

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetTime));

    // Check if rate limit exceeded
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
  /** Strict limit for login attempts: 5 attempts per 15 minutes */
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Moderate limit for registration: 3 attempts per hour */
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Standard API limit: 100 requests per minute */
  api: { limit: 100, windowMs: 60 * 1000 },
} as const;
