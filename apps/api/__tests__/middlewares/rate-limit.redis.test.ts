import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";

import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";

/**
 * In-memory stand-in for the Redis client, implementing the single `eval`
 * call the rate limiter issues (INCR + PEXPIRE on first hit, returns
 * [count, ttl]).
 */
class FakeRedis {
  store = new Map<string, { count: number; expiresAt: number }>();
  failing = false;
  lastKey: string | null = null;

  async eval(_script: string, _numKeys: number, key: string, windowMsArg: string): Promise<[number, number]> {
    if (this.failing) {
      throw new Error("Connection is closed");
    }

    this.lastKey = key;
    const windowMs = Number(windowMsArg);
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now >= entry.expiresAt) {
      entry = { count: 1, expiresAt: now + windowMs };
      this.store.set(key, entry);
    } else {
      entry.count++;
    }

    return [entry.count, entry.expiresAt - now];
  }
}

let fakeRedis: FakeRedis | null = null;

mock.module("@/lib/redis", () => ({
  getRedis: () => fakeRedis,
}));

afterAll(() => {
  // Back to "Redis not configured" so other test files exercise the memory path
  fakeRedis = null;
});

async function hit(app: Hono, ip: string): Promise<Response> {
  return app.request("/test", { headers: { "x-forwarded-for": ip } });
}

describe("rateLimiter with Redis", () => {
  beforeEach(() => {
    fakeRedis = new FakeRedis();
  });

  it("blocks the request after the limit is exceeded", async () => {
    const app = new Hono();
    app.get("/test", rateLimiter({ limit: 2, windowMs: 60_000 }), c => c.json({ ok: true }));

    expect((await hit(app, "1.1.1.1")).status).toBe(200);
    expect((await hit(app, "1.1.1.1")).status).toBe(200);
    expect((await hit(app, "1.1.1.1")).status).toBe(429);
  });

  it("namespaces counters by name and client key", async () => {
    const app = new Hono();
    app.get("/test", rateLimiter({ ...rateLimitPresets.login }), c => c.json({ ok: true }));

    await hit(app, "2.2.2.2");
    expect(fakeRedis?.lastKey).toBe("rate-limit:login:2.2.2.2");
  });

  it("shares counters between middlewares with the same name", async () => {
    const options = { name: "shared", limit: 2, windowMs: 60_000 };
    const appA = new Hono();
    appA.get("/test", rateLimiter(options), c => c.json({ ok: true }));
    const appB = new Hono();
    appB.get("/test", rateLimiter(options), c => c.json({ ok: true }));

    // Simulates two API instances pointing at the same Redis
    expect((await hit(appA, "3.3.3.3")).status).toBe(200);
    expect((await hit(appB, "3.3.3.3")).status).toBe(200);
    expect((await hit(appA, "3.3.3.3")).status).toBe(429);
    expect((await hit(appB, "3.3.3.3")).status).toBe(429);
  });

  it("keeps counters separate for different names", async () => {
    const appA = new Hono();
    appA.get("/test", rateLimiter({ name: "a", limit: 1, windowMs: 60_000 }), c => c.json({ ok: true }));
    const appB = new Hono();
    appB.get("/test", rateLimiter({ name: "b", limit: 1, windowMs: 60_000 }), c => c.json({ ok: true }));

    expect((await hit(appA, "4.4.4.4")).status).toBe(200);
    expect((await hit(appB, "4.4.4.4")).status).toBe(200);
    expect((await hit(appA, "4.4.4.4")).status).toBe(429);
  });

  it("sets rate limit headers from the Redis counter", async () => {
    const app = new Hono();
    app.get("/test", rateLimiter({ limit: 3, windowMs: 60_000 }), c => c.json({ ok: true }));

    const res = await hit(app, "5.5.5.5");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("2");
    expect(Number(res.headers.get("X-RateLimit-Reset"))).toBeGreaterThan(0);
  });

  it("falls back to the in-memory store when Redis is unreachable", async () => {
    const app = new Hono();
    app.get("/test", rateLimiter({ limit: 1, windowMs: 60_000 }), c => c.json({ ok: true }));

    fakeRedis!.failing = true;

    expect((await hit(app, "6.6.6.6")).status).toBe(200);
    expect((await hit(app, "6.6.6.6")).status).toBe(429);
  });
});
