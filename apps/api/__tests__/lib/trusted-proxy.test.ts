import { describe, expect, it, mock } from "bun:test";

// Mutable ENV object — the module reads TRUSTED_PROXY_HOPS once at import time,
// so each hop count needs a fresh module instance (see loadWithHops below).
const mockEnv = { TRUSTED_PROXY_HOPS: 1 as number | undefined };

mock.module("varlock/env", () => ({ ENV: mockEnv }));

type TrustedProxy = typeof import("@/lib/trusted-proxy");

/** Re-import the module with a given hop count baked in. */
async function loadWithHops(hops: number | undefined): Promise<TrustedProxy> {
  mockEnv.TRUSTED_PROXY_HOPS = hops;
  // A distinct query string defeats the module cache without touching globals.
  return await import(`@/lib/trusted-proxy?hops=${hops}`) as TrustedProxy;
}

/** A context standing in for a request with the given URL and headers. */
function ctx(url: string, headers: Record<string, string> = {}): any {
  return {
    req: {
      url,
      header: (name: string) => headers[name.toLowerCase()],
    },
  };
}

describe("clientIp", () => {
  it("takes the entry the trusted proxy appended, not the client-supplied one", async () => {
    const { clientIp } = await loadWithHops(1);

    // The leftmost entry is whatever the caller sent; only the rightmost was
    // written by our own proxy.
    const c = ctx("http://api/", { "x-forwarded-for": "1.2.3.4, 10.0.0.1" });

    expect(clientIp(c)).toBe("10.0.0.1");
  });

  it("ignores a fully forged chain", async () => {
    const { clientIp } = await loadWithHops(1);
    const c = ctx("http://api/", { "x-forwarded-for": "6.6.6.6, 7.7.7.7, 10.0.0.1" });

    expect(clientIp(c)).toBe("10.0.0.1");
  });

  it("counts from the right with two proxies", async () => {
    const { clientIp } = await loadWithHops(2);
    const c = ctx("http://api/", { "x-forwarded-for": "9.9.9.9, 203.0.113.7, 172.18.0.4" });

    expect(clientIp(c)).toBe("203.0.113.7");
  });

  it("returns unknown rather than a forged value when no proxy is trusted", async () => {
    const { clientIp } = await loadWithHops(0);
    const c = ctx("http://api/", { "x-forwarded-for": "1.2.3.4" });

    expect(clientIp(c)).toBe("unknown");
  });

  it("returns unknown when the header is absent", async () => {
    const { clientIp } = await loadWithHops(1);

    expect(clientIp(ctx("http://api/"))).toBe("unknown");
  });

  it("defaults to one hop when the variable is unset", async () => {
    const { clientIp } = await loadWithHops(undefined);
    const c = ctx("http://api/", { "x-forwarded-for": "1.2.3.4, 10.0.0.1" });

    expect(clientIp(c)).toBe("10.0.0.1");
  });
});

describe("publicOrigin", () => {
  it("honours X-Forwarded-* behind a trusted proxy", async () => {
    const { publicOrigin } = await loadWithHops(1);
    const c = ctx("http://api:3000/auth/login", {
      "host": "api:3000",
      "x-forwarded-host": "example.com",
      "x-forwarded-proto": "https",
    });

    expect(publicOrigin(c)).toBe("https://example.com");
  });

  it("falls back to Host when only the proto is forwarded", async () => {
    const { publicOrigin } = await loadWithHops(1);
    const c = ctx("http://api:3000/", { "host": "example.com", "x-forwarded-proto": "https" });

    expect(publicOrigin(c)).toBe("https://example.com");
  });

  it("ignores forwarded headers when no proxy is trusted", async () => {
    const { publicOrigin } = await loadWithHops(0);
    const c = ctx("http://192.168.1.50:3000/", {
      "x-forwarded-host": "attacker.com",
      "x-forwarded-proto": "https",
    });

    expect(publicOrigin(c)).toBe("http://192.168.1.50:3000");
  });

  it("keeps the port of a LAN address", async () => {
    const { publicOrigin } = await loadWithHops(1);
    const c = ctx("http://api:3000/", { host: "192.168.1.50:3000" });

    expect(publicOrigin(c)).toBe("http://192.168.1.50:3000");
  });

  it("supports a .local hostname", async () => {
    const { publicOrigin } = await loadWithHops(1);
    const c = ctx("http://api:3000/", { host: "myapp.local" });

    expect(publicOrigin(c)).toBe("http://myapp.local");
  });

  it("takes only the first entry of a multi-hop proto header", async () => {
    const { publicOrigin } = await loadWithHops(1);
    const c = ctx("http://api:3000/", {
      "host": "api:3000",
      "x-forwarded-host": "example.com",
      "x-forwarded-proto": "https, http",
    });

    expect(publicOrigin(c)).toBe("https://example.com");
  });

  // A header carrying a path, a scheme or whitespace must not be able to
  // reshape the URLs built from it.
  it("rejects a malformed forwarded host and falls back to the request URL", async () => {
    const { publicOrigin } = await loadWithHops(1);
    const c = ctx("http://api:3000/", { "x-forwarded-host": "evil.com/path" });

    expect(publicOrigin(c)).toBe("http://api:3000");
  });
});

describe("isSecureRequest", () => {
  it("is true when the browser reached the proxy over HTTPS", async () => {
    const { isSecureRequest } = await loadWithHops(1);
    const c = ctx("http://api:3000/", { "host": "example.com", "x-forwarded-proto": "https" });

    expect(isSecureRequest(c)).toBe(true);
  });

  it("is false on a plain-HTTP deployment", async () => {
    const { isSecureRequest } = await loadWithHops(1);

    expect(isSecureRequest(ctx("http://192.168.1.50:3000/"))).toBe(false);
  });
});
