import type { Context } from "hono";

import { describe, expect, it } from "bun:test";

import { getClientInfo } from "@/helpers/get-client-info";

function makeContext(headers: Record<string, string | null>): Context {
  return {
    req: {
      raw: {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
      },
    },
  } as unknown as Context;
}

describe("getClientInfo", () => {
  describe("IP extraction", () => {
    it("uses the first IP from x-forwarded-for header", () => {
      const ctx = makeContext({ "x-forwarded-for": "192.168.1.1" });
      expect(getClientInfo(ctx).ip).toBe("192.168.1.1");
    });

    it("uses only the first IP when multiple are listed", () => {
      const ctx = makeContext({ "x-forwarded-for": "10.0.0.1, 172.16.0.1, 192.168.1.1" });
      expect(getClientInfo(ctx).ip).toBe("10.0.0.1");
    });

    it("trims whitespace from the extracted IP", () => {
      const ctx = makeContext({ "x-forwarded-for": "  203.0.113.5  , 10.0.0.1" });
      expect(getClientInfo(ctx).ip).toBe("203.0.113.5");
    });

    it("falls back to '::1' when x-forwarded-for is missing", () => {
      const ctx = makeContext({});
      expect(getClientInfo(ctx).ip).toBe("::1");
    });

    it("falls back to '::1' when x-forwarded-for is null", () => {
      const ctx = makeContext({ "x-forwarded-for": null });
      expect(getClientInfo(ctx).ip).toBe("::1");
    });
  });

  describe("user-agent extraction", () => {
    it("returns the user-agent header value", () => {
      const ua = "Mozilla/5.0 (compatible; TestBot/1.0)";
      const ctx = makeContext({ "user-agent": ua });
      expect(getClientInfo(ctx).userAgent).toBe(ua);
    });

    it("returns an empty string when user-agent is missing", () => {
      const ctx = makeContext({});
      expect(getClientInfo(ctx).userAgent).toBe("");
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
    const info = getClientInfo(ctx);
    expect(info).toEqual({ ip: "1.2.3.4", userAgent: "TestAgent/2.0" });
  });
});
