import { describe, expect, it } from "bun:test";

import { capitalized, optionalString, trimmed, uppercased } from "~shared/lib/schema-utils";

describe("trimmed", () => {
  it("strips surrounding whitespace", () => {
    expect(trimmed.parse("  hello  ")).toBe("hello");
  });

  it("leaves already-trimmed values untouched", () => {
    expect(trimmed.parse("hello")).toBe("hello");
  });
});

describe("uppercased", () => {
  it("trims and uppercases", () => {
    expect(uppercased.parse("  fr ")).toBe("FR");
  });
});

describe("capitalized", () => {
  it("upper-cases the first letter of each word", () => {
    expect(capitalized.parse("jean dupont")).toBe("Jean Dupont");
  });

  it("trims before capitalising", () => {
    expect(capitalized.parse("  marie curie ")).toBe("Marie Curie");
  });
});

describe("optionalString", () => {
  it("returns null for null", () => {
    expect(optionalString.parse(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(optionalString.parse(undefined)).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(optionalString.parse("   ")).toBeNull();
  });

  it("trims a non-empty string", () => {
    expect(optionalString.parse("  hi  ")).toBe("hi");
  });
});
