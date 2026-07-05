import { afterEach, beforeEach, describe, expect, it, setSystemTime } from "bun:test";

import { resolveRange } from "~shared/lib/date-range";

// Fixed "now": Thursday 2 July 2026, 12:00 local time.
const NOW = new Date("2026-07-02T12:00:00");

describe("resolveRange", () => {
  beforeEach(() => {
    setSystemTime(NOW);
  });

  afterEach(() => {
    setSystemTime();
  });

  describe("custom range", () => {
    it("returns the parsed from/to and no preset", () => {
      const result = resolveRange({ from: "2026-01-01T00:00:00.000Z", to: "2026-02-01T00:00:00.000Z" });
      expect(result.from).toEqual(new Date("2026-01-01T00:00:00.000Z"));
      expect(result.to).toEqual(new Date("2026-02-01T00:00:00.000Z"));
      expect(result.preset).toBeUndefined();
    });

    it("prefers a custom range over a preset when both are provided", () => {
      const result = resolveRange({
        range: "30d",
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-02-01T00:00:00.000Z",
      });
      expect(result.from).toEqual(new Date("2026-01-01T00:00:00.000Z"));
      expect(result.preset).toBeUndefined();
    });
  });

  describe("presets", () => {
    it("defaults to a forward 7-day window when no range is given", () => {
      const result = resolveRange({});
      expect(result.from).toEqual(NOW);
      expect(result.to).toEqual(new Date("2026-07-09T12:00:00"));
      expect(result.preset).toBeUndefined();
    });

    it("today spans start to end of the current day", () => {
      const result = resolveRange({ range: "today" });
      expect(result.from).toEqual(new Date("2026-07-02T00:00:00.000"));
      expect(result.to).toEqual(new Date("2026-07-02T23:59:59.999"));
      expect(result.preset).toBe("today");
    });

    it("24h ends 24 hours from now", () => {
      const result = resolveRange({ range: "24h" });
      expect(result.from).toEqual(NOW);
      expect(result.to).toEqual(new Date("2026-07-03T12:00:00"));
    });

    it("this_week spans Monday 00:00 to Sunday 23:59", () => {
      // 2 July 2026 is a Thursday -> Monday 29 June ... Sunday 5 July
      const result = resolveRange({ range: "this_week" });
      expect(result.from).toEqual(new Date("2026-06-29T00:00:00.000"));
      expect(result.to).toEqual(new Date("2026-07-05T23:59:59.999"));
    });

    it("7d ends 7 days from now", () => {
      const result = resolveRange({ range: "7d" });
      expect(result.to).toEqual(new Date("2026-07-09T12:00:00"));
    });

    it("this_month spans the 1st to the last day of the month", () => {
      const result = resolveRange({ range: "this_month" });
      expect(result.from).toEqual(new Date("2026-07-01T00:00:00.000"));
      expect(result.to).toEqual(new Date("2026-07-31T23:59:59.999"));
    });

    it("30d ends 30 days from now", () => {
      const result = resolveRange({ range: "30d" });
      expect(result.to).toEqual(new Date("2026-08-01T12:00:00"));
    });

    it("90d ends 90 days from now", () => {
      const result = resolveRange({ range: "90d" });
      expect(result.to).toEqual(new Date("2026-09-30T12:00:00"));
    });

    it("this_year spans Jan 1 to Dec 31", () => {
      const result = resolveRange({ range: "this_year" });
      expect(result.from).toEqual(new Date("2026-01-01T00:00:00.000"));
      expect(result.to).toEqual(new Date("2026-12-31T23:59:59.999"));
    });

    it("6m ends six months from now", () => {
      const result = resolveRange({ range: "6m" });
      expect(result.to).toEqual(new Date("2027-01-02T12:00:00"));
    });

    it("12m ends one year from now", () => {
      const result = resolveRange({ range: "12m" });
      expect(result.to).toEqual(new Date("2027-07-02T12:00:00"));
    });
  });
});
