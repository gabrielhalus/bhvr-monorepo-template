import { describe, expect, it } from "bun:test";

import { inferConfigValue } from "~shared/helpers/infer-config-value";

describe("inferConfigValue", () => {
  it("parses boolean true", () => {
    expect(inferConfigValue("true")).toBe(true);
  });

  it("parses boolean false", () => {
    expect(inferConfigValue("false")).toBe(false);
  });

  it("parses integers", () => {
    expect(inferConfigValue("42")).toBe(42);
  });

  it("parses floating point numbers", () => {
    expect(inferConfigValue("3.14")).toBe(3.14);
  });

  it("parses null", () => {
    expect(inferConfigValue("null")).toBeNull();
  });

  it("parses a JSON array", () => {
    expect(inferConfigValue("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("parses a JSON object", () => {
    expect(inferConfigValue("{\"key\":\"value\"}")).toEqual({ key: "value" });
  });

  it("returns the original string for invalid JSON", () => {
    expect(inferConfigValue("not-json")).toBe("not-json");
  });

  it("returns the original string for an empty string (invalid JSON)", () => {
    expect(inferConfigValue("")).toBe("");
  });

  it("returns the original string for partial JSON", () => {
    expect(inferConfigValue("{unclosed")).toBe("{unclosed");
  });

  it("returns a plain string for JSON-encoded strings (they parse to strings)", () => {
    expect(inferConfigValue("\"hello\"")).toBe("hello");
  });

  it("handles zero", () => {
    expect(inferConfigValue("0")).toBe(0);
  });

  it("handles negative numbers", () => {
    expect(inferConfigValue("-5")).toBe(-5);
  });
});
