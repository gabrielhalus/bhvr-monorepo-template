import type { Context } from "hono";

import { describe, expect, it } from "bun:test";

import { getClientInfo } from "@/helpers/get-client-info";

function makeContext(headers: Record<string, string | null>): Context {
  return {
    req: {
      header: (name: string) => headers[name.toLowerCase()] ?? undefined,
    },
  } as unknown as Context;
}

// TRUSTED_PROXY_HOPS defaults to 1, so only the last X-Forwarded-For entry —
// the one our own proxy appended — is trusted.
describe("getClientInfo", () => {
  describe("IP extraction", () => {
    it("uses the single x-forwarded-for entry a lone proxy appended", () => {
      const ctx = makeContext({ "x-forwarded-for": "192.168.1.1" });
      expect(getClientInfo(ctx).ip).toBe("192.168.1.1");
    });

    // The leftmost entries are client-supplied: honouring them would let a
    // caller rotate the header to dodge rate limits and forge audit-log IPs.
    it("ignores the client-supplied entries and takes the proxy's", () => {
      const ctx = makeContext({ "x-forwarded-for": "10.0.0.1, 172.16.0.1, 192.168.1.1" });
      expect(getClientInfo(ctx).ip).toBe("192.168.1.1");
    });

    it("trims whitespace from the extracted IP", () => {
      const ctx = makeContext({ "x-forwarded-for": "203.0.113.5,   10.0.0.1  " });
      expect(getClientInfo(ctx).ip).toBe("10.0.0.1");
    });

    it("returns 'unknown' when x-forwarded-for is missing", () => {
      expect(getClientInfo(makeContext({})).ip).toBe("unknown");
    });

    it("returns 'unknown' when x-forwarded-for is null", () => {
      const ctx = makeContext({ "x-forwarded-for": null });
      expect(getClientInfo(ctx).ip).toBe("unknown");
    });
  });

  describe("user-agent extraction", () => {
    it("returns the user-agent header value", () => {
      const ua = "Mozilla/5.0 (compatible; TestBot/1.0)";
      const ctx = makeContext({ "user-agent": ua });
      expect(getClientInfo(ctx).userAgent).toBe(ua);
    });

    it("returns an empty string when user-agent is missing", () => {
      expect(getClientInfo(makeContext({})).userAgent).toBe("");
    });

    it("returns an empty string when user-agent is null", () => {
      const ctx = makeContext({ "user-agent": null });
      expect(getClientInfo(ctx).userAgent).toBe("");
    });
  });

  it("returns both ip and userAgent together", () => {
    const ctx = makeContext({
      "x-forwarded-for": "1.2.3.4",
      "user-agent": "TestAgent/2.0",
    });

    expect(getClientInfo(ctx)).toEqual({ ip: "1.2.3.4", userAgent: "TestAgent/2.0" });
  });
});
