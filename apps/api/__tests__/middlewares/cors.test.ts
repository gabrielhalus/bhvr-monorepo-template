import { describe, expect, it, mock } from "bun:test";

// Mutable ENV object — the middleware reads ALLOWED_ORIGINS when it is built,
// so each allowlist needs a fresh module instance (see loadWith below).
const mockEnv = { ALLOWED_ORIGINS: undefined as string | undefined };

mock.module("varlock/env", () => ({ ENV: mockEnv }));

/** Build an app whose CORS middleware was created with the given allowlist. */
async function loadWith(allowedOrigins: string | undefined) {
  mockEnv.ALLOWED_ORIGINS = allowedOrigins;
  // A distinct query string defeats the module cache without touching globals.
  const { default: cors } = await import(`@/middlewares/cors?origins=${allowedOrigins ?? "none"}`) as typeof import("@/middlewares/cors");

  const { Hono } = await import("hono");
  const app = new Hono();
  app.use(cors());
  app.get("/ping", c => c.json({ ok: true }));
  app.post("/ping", c => c.json({ ok: true }));
  return app;
}

function allowOrigin(res: Response): string | null {
  return res.headers.get("access-control-allow-origin");
}

describe("cors middleware", () => {
  describe("same-origin default (no allowlist)", () => {
    // Emitting no CORS header is the safe default: the browser then refuses any
    // cross-origin read, and the bundled deployment never needs one because the
    // proxy serves the SPA and the API under a single origin.
    it("emits no allow-origin header for a foreign origin", async () => {
      const app = await loadWith(undefined);
      const res = await app.request("/ping", { headers: { Origin: "https://evil.com" } });

      expect(res.status).toBe(200);
      expect(allowOrigin(res)).toBeNull();
    });

    it("emits no allow-origin header for an empty allowlist", async () => {
      const app = await loadWith("");
      const res = await app.request("/ping", { headers: { Origin: "https://example.com" } });

      expect(allowOrigin(res)).toBeNull();
    });

    it("still serves same-origin requests normally", async () => {
      const app = await loadWith(undefined);
      const res = await app.request("/ping");

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });
  });

  describe("explicit allowlist", () => {
    it("echoes an allowed origin", async () => {
      const app = await loadWith("https://app.example.com");
      const res = await app.request("/ping", { headers: { Origin: "https://app.example.com" } });

      expect(allowOrigin(res)).toBe("https://app.example.com");
    });

    it("accepts several origins", async () => {
      const app = await loadWith("https://a.example.com, https://b.example.com");
      const res = await app.request("/ping", { headers: { Origin: "https://b.example.com" } });

      expect(allowOrigin(res)).toBe("https://b.example.com");
    });

    it("tolerates a trailing slash in the configured value", async () => {
      const app = await loadWith("https://app.example.com/");
      const res = await app.request("/ping", { headers: { Origin: "https://app.example.com" } });

      expect(allowOrigin(res)).toBe("https://app.example.com");
    });

    it("rejects an origin that is not listed", async () => {
      const app = await loadWith("https://app.example.com");
      const res = await app.request("/ping", { headers: { Origin: "https://evil.com" } });

      expect(allowOrigin(res)).toBeNull();
    });

    // The previous implementation matched on hostname suffix, so one subdomain
    // takeover granted credentialed access to the whole API.
    it("rejects a subdomain of an allowed origin", async () => {
      const app = await loadWith("https://a.example.com");
      const res = await app.request("/ping", { headers: { Origin: "https://evil.a.example.com" } });

      expect(allowOrigin(res)).toBeNull();
    });

    it("rejects a different port on an allowed host", async () => {
      const app = await loadWith("https://example.com");
      const res = await app.request("/ping", { headers: { Origin: "https://example.com:1337" } });

      expect(allowOrigin(res)).toBeNull();
    });

    it("rejects a different scheme on an allowed host", async () => {
      const app = await loadWith("https://example.com");
      const res = await app.request("/ping", { headers: { Origin: "http://example.com" } });

      expect(allowOrigin(res)).toBeNull();
    });

    it("allows credentials for a listed origin", async () => {
      const app = await loadWith("https://app.example.com");
      const res = await app.request("/ping", { headers: { Origin: "https://app.example.com" } });

      expect(res.headers.get("access-control-allow-credentials")).toBe("true");
    });

    it("answers a preflight from a listed origin", async () => {
      const app = await loadWith("https://app.example.com");
      const res = await app.request("/ping", {
        method: "OPTIONS",
        headers: {
          "Origin": "https://app.example.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      expect(allowOrigin(res)).toBe("https://app.example.com");
      expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    });

    it("does not authorize a preflight from an unlisted origin", async () => {
      const app = await loadWith("https://app.example.com");
      const res = await app.request("/ping", {
        method: "OPTIONS",
        headers: {
          "Origin": "https://evil.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      expect(allowOrigin(res)).toBeNull();
    });
  });
});
