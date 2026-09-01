import { describe, expect, it } from "bun:test";

import { sanitizeRedirect } from "@/lib/safe-redirect";

describe("sanitizeRedirect", () => {
  describe("accepted paths", () => {
    const allowed = [
      "/",
      "/account",
      "/account-settings",
      "/users/abc123",
      "/users?page=2&sort=name",
      "/account?linked=google#section",
      "/résumé",
    ];

    for (const path of allowed) {
      it(`keeps ${path}`, () => {
        expect(sanitizeRedirect(path)).toBe(path);
      });
    }
  });

  describe("open redirect attempts", () => {
    // Since the Location header is now relative, anything the browser could
    // resolve to a foreign authority has to be rejected here.
    const rejected: [string, string][] = [
      ["//evil.com", "scheme-relative"],
      ["///evil.com", "triple slash"],
      ["/\\evil.com", "backslash-relative — the URL parser reads it as //"],
      ["/\\\\evil.com", "double backslash"],
      ["/path\\..\\evil", "embedded backslash"],
      ["https://evil.com", "absolute URL"],
      ["http://evil.com", "absolute URL"],
      ["javascript:alert(1)", "javascript scheme"],
      ["data:text/html,<script>", "data scheme"],
      ["account", "no leading slash"],
      ["", "empty"],
    ];

    for (const [input, why] of rejected) {
      it(`rejects ${JSON.stringify(input)} (${why})`, () => {
        expect(sanitizeRedirect(input)).toBe("/");
      });
    }
  });

  describe("header injection attempts", () => {
    it("rejects a CRLF sequence", () => {
      expect(sanitizeRedirect("/account\r\nSet-Cookie: a=b")).toBe("/");
    });

    it("rejects a bare newline", () => {
      expect(sanitizeRedirect("/account\nX-Injected: 1")).toBe("/");
    });

    it("rejects a NUL byte", () => {
      expect(sanitizeRedirect("/account\u0000")).toBe("/");
    });

    it("rejects DEL", () => {
      expect(sanitizeRedirect("/account\u007F")).toBe("/");
    });
  });

  describe("edge cases", () => {
    it("falls back to / for undefined", () => {
      expect(sanitizeRedirect(undefined)).toBe("/");
    });

    it("rejects an overlong path", () => {
      expect(sanitizeRedirect(`/${"a".repeat(512)}`)).toBe("/");
    });

    it("keeps a path at the length limit", () => {
      const path = `/${"a".repeat(511)}`;
      expect(sanitizeRedirect(path)).toBe(path);
    });
  });
});
