import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import { Hono } from "hono";

import { rateLimiter, rateLimitPresets } from "@/middlewares/rate-limit";

function buildApp(options: Parameters<typeof rateLimiter>[0]) {
  const app = new Hono();
  app.get("/test", rateLimiter(options), c => c.json({ ok: true }));
  return app;
}

async function hit(app: Hono, headers: Record<string, string> = {}): Promise<Response> {
  return app.request("/test", { headers });
}

// ── core rate limiting ───────────────────────────────────────────────────────

describe("rateLimiter", () => {
  it("allows requests within the limit", async () => {
    const app = buildApp({ limit: 3, windowMs: 60_000 });
    const res = await hit(app, { "x-forwarded-for": "1.1.1.1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("blocks the request after the limit is exceeded", async () => {
    const app = buildApp({ limit: 2, windowMs: 60_000 });
    const ip = "2.2.2.2";

    await hit(app, { "x-forwarded-for": ip });
    await hit(app, { "x-forwarded-for": ip });
    const blockedRes = await hit(app, { "x-forwarded-for": ip });

    expect(blockedRes.status).toBe(429);
  });

  it("returns the default error message on 429", async () => {
    const app = buildApp({ limit: 1, windowMs: 60_000 });
    const ip = "3.3.3.3";
    await hit(app, { "x-forwarded-for": ip });
    const res = await hit(app, { "x-forwarded-for": ip });
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Too many requests");
  });

  it("returns a custom error message on 429", async () => {
    const app = buildApp({ limit: 1, windowMs: 60_000, message: "slow down!" });
    const ip = "4.4.4.4";
    await hit(app, { "x-forwarded-for": ip });
    const res = await hit(app, { "x-forwarded-for": ip });
    const body = await res.json();
    expect(body.error).toBe("slow down!");
  });

  // ── rate limit headers ─────────────────────────────────────────────────
  describe("rate limit headers", () => {
    it("sets X-RateLimit-Limit header", async () => {
      const app = buildApp({ limit: 5, windowMs: 60_000 });
      const res = await hit(app, { "x-forwarded-for": "5.5.5.5" });
      expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
    });

    it("sets X-RateLimit-Remaining header and decrements it", async () => {
      const app = buildApp({ limit: 3, windowMs: 60_000 });
      const ip = "6.6.6.6";

      const res1 = await hit(app, { "x-forwarded-for": ip });
      expect(res1.headers.get("X-RateLimit-Remaining")).toBe("2");

      const res2 = await hit(app, { "x-forwarded-for": ip });
      expect(res2.headers.get("X-RateLimit-Remaining")).toBe("1");

      const res3 = await hit(app, { "x-forwarded-for": ip });
      expect(res3.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("sets X-RateLimit-Remaining to 0 when limit is exceeded", async () => {
      const app = buildApp({ limit: 1, windowMs: 60_000 });
      const ip = "7.7.7.7";
      await hit(app, { "x-forwarded-for": ip });
      const res = await hit(app, { "x-forwarded-for": ip });
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("sets X-RateLimit-Reset header as a positive number", async () => {
      const app = buildApp({ limit: 5, windowMs: 60_000 });
      const res = await hit(app, { "x-forwarded-for": "8.8.8.8" });
      const reset = Number(res.headers.get("X-RateLimit-Reset"));
      expect(reset).toBeGreaterThan(0);
    });

    it("sets Retry-After header on 429 response", async () => {
      const app = buildApp({ limit: 1, windowMs: 60_000 });
      const ip = "9.9.9.9";
      await hit(app, { "x-forwarded-for": ip });
      const res = await hit(app, { "x-forwarded-for": ip });
      expect(res.headers.get("Retry-After")).not.toBeNull();
    });
  });

  // ── key isolation ──────────────────────────────────────────────────────
  describe("key isolation", () => {
    it("tracks different IPs separately", async () => {
      const app = buildApp({ limit: 1, windowMs: 60_000 });

      const res1 = await hit(app, { "x-forwarded-for": "10.0.0.1" });
      const res2 = await hit(app, { "x-forwarded-for": "10.0.0.2" });

      // Each IP has its own counter, so both first requests pass
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });

    it("uses x-real-ip when x-forwarded-for is absent", async () => {
      const app = buildApp({ limit: 1, windowMs: 60_000 });
      const ip = "11.0.0.1";
      await hit(app, { "x-real-ip": ip });
      const blocked = await hit(app, { "x-real-ip": ip });
      expect(blocked.status).toBe(429);
    });

    it("falls back to 'unknown' when no IP header is present", async () => {
      const app = buildApp({ limit: 1, windowMs: 60_000 });
      await hit(app);
      const blocked = await hit(app);
      // Both requests have no IP, so they share the "unknown" key
      expect(blocked.status).toBe(429);
    });

    it("supports a custom key generator", async () => {
      const app = new Hono();
      app.get(
        "/test",
        rateLimiter({
          limit: 1,
          windowMs: 60_000,
          keyGenerator: c => c.req.header("x-api-key") ?? "anon",
        }),
        c => c.json({ ok: true }),
      );

      // Same API key → shared counter
      await app.request("/test", { headers: { "x-api-key": "key-abc" } });
      const blocked = await app.request("/test", { headers: { "x-api-key": "key-abc" } });
      expect(blocked.status).toBe(429);

      // Different API key → separate counter
      const allowed = await app.request("/test", { headers: { "x-api-key": "key-xyz" } });
      expect(allowed.status).toBe(200);
    });
  });

  // ── cleanup interval ──────────────────────────────────────────────────
  describe("cleanup interval", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("removes expired entries when the cleanup interval fires", async () => {
      const windowMs = 500;
      const app = buildApp({ limit: 1, windowMs });
      const ip = "cleanup.test.ip";

      // Exhaust the limit
      await hit(app, { "x-forwarded-for": ip });
      const blocked = await hit(app, { "x-forwarded-for": ip });
      expect(blocked.status).toBe(429);

      // Advance time past the window so the store entry expires and cleanup runs
      jest.advanceTimersByTime(windowMs + 1);

      // Now the entry has been cleaned up AND its resetAt is in the past,
      // so the next request creates a fresh record (count=1).
      const afterCleanup = await hit(app, { "x-forwarded-for": ip });
      expect(afterCleanup.status).toBe(200);
    });
  });
});

// ── rateLimitPresets ─────────────────────────────────────────────────────────

describe("rateLimitPresets", () => {
  it("has login preset with limit 10 and 15-minute window", () => {
    expect(rateLimitPresets.login.limit).toBe(10);
    expect(rateLimitPresets.login.windowMs).toBe(15 * 60 * 1000);
  });

  it("has register preset with limit 5 and 1-hour window", () => {
    expect(rateLimitPresets.register.limit).toBe(5);
    expect(rateLimitPresets.register.windowMs).toBe(60 * 60 * 1000);
  });

  it("has api preset with limit 300 and 1-minute window", () => {
    expect(rateLimitPresets.api.limit).toBe(300);
    expect(rateLimitPresets.api.windowMs).toBe(60 * 1000);
  });
});
