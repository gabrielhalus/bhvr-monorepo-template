import { describe, expect, it } from "bun:test";

import { formatValue } from "~shared/i18n/format";

describe("formatValue", () => {
  // ── null / undefined ───────────────────────────────────────────────────
  describe("null and undefined inputs", () => {
    it("returns '—' for null", () => {
      expect(formatValue(null)).toBe("—");
    });

    it("returns '—' for undefined", () => {
      expect(formatValue(undefined)).toBe("—");
    });
  });

  // ── booleans ───────────────────────────────────────────────────────────
  describe("boolean values", () => {
    it("returns '✓' for true", () => {
      expect(formatValue(true)).toBe("✓");
    });

    it("returns '—' for false", () => {
      expect(formatValue(false)).toBe("—");
    });
  });

  // ── strings ────────────────────────────────────────────────────────────
  describe("string values", () => {
    it("returns the string as-is", () => {
      expect(formatValue("hello")).toBe("hello");
    });

    it("returns empty string unchanged", () => {
      expect(formatValue("")).toBe("");
    });
  });

  // ── numbers ────────────────────────────────────────────────────────────
  describe("number values", () => {
    it("formats a plain number using Intl.NumberFormat", () => {
      const result = formatValue(1234567, { locale: "en-US" });
      expect(result).toBe("1,234,567");
    });

    it("formats zero", () => {
      const result = formatValue(0, { locale: "en-US" });
      expect(result).toBe("0");
    });

    it("formats negative numbers", () => {
      const result = formatValue(-42, { locale: "en-US" });
      expect(result).toBe("-42");
    });

    it("formats a number as currency", () => {
      const result = formatValue(9.99, { locale: "en-US", format: "currency", currency: "USD" });
      expect(result).toContain("9.99");
    });

    it("uses USD as default currency when not specified", () => {
      const result = formatValue(10, { locale: "en-US", format: "currency" });
      expect(result).toContain("$");
    });

    it("formats a number as percent", () => {
      const result = formatValue(0.5, { locale: "en-US", format: "percent" });
      expect(result).toBe("50%");
    });

    it("formats number with explicit number format", () => {
      const result = formatValue(42, { locale: "en-US", format: "number" });
      expect(result).toBe("42");
    });

    it("caches formatters for the same locale and format", () => {
      // Calling twice should not throw or cause issues (tests the caching path)
      const first = formatValue(1, { locale: "en-US", format: "currency", currency: "EUR" });
      const second = formatValue(2, { locale: "en-US", format: "currency", currency: "EUR" });
      expect(first).not.toBe(second);
    });
  });

  // ── Date values ────────────────────────────────────────────────────────
  describe("Date values", () => {
    const testDate = new Date("2024-06-15T14:30:00.000Z");

    it("formats as datetime by default (no format specified)", () => {
      const result = formatValue(testDate, { locale: "en-US" });
      // Should contain year
      expect(result).toMatch(/2024/);
    });

    it("formats as date only", () => {
      const result = formatValue(testDate, { locale: "en-US", format: "date" });
      // date-only: no time component but has year/month/day
      expect(result).toMatch(/2024/);
    });

    it("formats as time only", () => {
      const result = formatValue(testDate, { locale: "en-US", format: "time" });
      // time format should contain hour/minute notation
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats as datetime explicitly", () => {
      const result = formatValue(testDate, { locale: "en-US", format: "datetime" });
      expect(result).toMatch(/2024/);
    });

    it("formats as relative time", () => {
      // A date far in the future should produce a future-relative string
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const result = formatValue(future, { locale: "en-US", format: "relative" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats relative time for a past date", () => {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = formatValue(past, { locale: "en-US", format: "relative" });
      expect(result).toContain("hour");
    });

    it("formats relative time for a date minutes ago", () => {
      const past = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = formatValue(past, { locale: "en-US", format: "relative" });
      expect(result).toContain("minute");
    });

    it("formats relative time for a date seconds ago", () => {
      const past = new Date(Date.now() - 10 * 1000); // 10 seconds ago
      const result = formatValue(past, { locale: "en-US", format: "relative" });
      expect(result).toContain("second");
    });

    it("formats relative time with a specific unit via relativetime(day)", () => {
      const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const result = formatValue(future, { locale: "en-US", format: "relativetime(day)" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats relative time with relativetime(year)", () => {
      const future = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
      const result = formatValue(future, { locale: "en-US", format: "relativetime(year)" });
      expect(typeof result).toBe("string");
    });

    it("caches date formatters for the same locale and kind", () => {
      const d1 = formatValue(testDate, { locale: "fr-FR", format: "date" });
      const d2 = formatValue(new Date("2024-01-01"), { locale: "fr-FR", format: "date" });
      expect(typeof d1).toBe("string");
      expect(typeof d2).toBe("string");
    });
  });

  // ── unknown format ─────────────────────────────────────────────────────
  describe("unknown format falls back to string format", () => {
    it("treats unrecognised format as 'string' for non-date values", () => {
      // An unrecognised format for a string value → just returns the string
      const result = formatValue("test", { format: "unknown_format" as any });
      expect(result).toBe("test");
    });
  });
});
