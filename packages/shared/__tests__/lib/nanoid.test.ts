import { describe, expect, it } from "bun:test";

import { nanoid } from "~shared/lib/nanoid";

const ALL_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

function onlyContains(id: string, chars: string): boolean {
  return id.split("").every(c => chars.includes(c));
}

describe("nanoid", () => {
  it("returns a string of default length 21", () => {
    const id = nanoid();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(21);
  });

  it("uses the default alphabet (numbers + upper + lower + symbols)", () => {
    const id = nanoid();
    expect(onlyContains(id, ALL_CHARS)).toBe(true);
  });

  it("respects a custom size", () => {
    expect(nanoid({ size: 10 }).length).toBe(10);
    expect(nanoid({ size: 36 }).length).toBe(36);
  });

  it("generates uppercase-only IDs", () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
    const id = nanoid({ lowercase: false });
    expect(onlyContains(id, chars)).toBe(true);
  });

  it("generates lowercase-only IDs", () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz-_";
    const id = nanoid({ uppercase: false });
    expect(onlyContains(id, chars)).toBe(true);
  });

  it("generates numeric-only IDs when uppercase/lowercase/symbols are disabled", () => {
    const id = nanoid({ uppercase: false, lowercase: false, symbols: false });
    expect(onlyContains(id, "0123456789")).toBe(true);
  });

  it("uses a custom alphabet", () => {
    const id = nanoid({ custom: "abc" });
    expect(onlyContains(id, "abc")).toBe(true);
  });

  it("throws when the effective alphabet is empty", () => {
    expect(() => nanoid({ uppercase: false, lowercase: false, numbers: false, symbols: false })).toThrow(
      "nanoid: alphabet must not be empty",
    );
  });

  it("generates unique IDs on repeated calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => nanoid()));
    expect(ids.size).toBe(100);
  });

  it("custom size 1 returns a single character from the alphabet", () => {
    const id = nanoid({ size: 1, custom: "XYZ" });
    expect(id.length).toBe(1);
    expect("XYZ".includes(id)).toBe(true);
  });
});
