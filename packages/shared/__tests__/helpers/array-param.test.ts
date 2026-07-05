import { describe, expect, it } from "bun:test";
import { z } from "zod";

import { arrayParam } from "~shared/helpers/array-param";

describe("arrayParam", () => {
  const schema = arrayParam(z.string());

  it("passes through an existing array unchanged", () => {
    const result = schema.safeParse(["a", "b", "c"]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["a", "b", "c"]);
  });

  it("wraps a single value in an array", () => {
    const result = schema.safeParse("hello");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["hello"]);
  });

  it("wraps a single number in an array when using number schema", () => {
    const numSchema = arrayParam(z.number());
    const result = numSchema.safeParse(42);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([42]);
  });

  it("returns undefined for undefined input", () => {
    const result = schema.safeParse(undefined);
    // preprocessor returns undefined → z.array fails (not an array)
    expect(result.success).toBe(false);
  });

  it("returns undefined for null input", () => {
    const result = schema.safeParse(null);
    // preprocessor returns undefined → z.array fails
    expect(result.success).toBe(false);
  });

  it("validates each element against the inner schema", () => {
    // string schema should reject numbers
    const result = schema.safeParse(["a", 42]);
    expect(result.success).toBe(false);
  });

  it("works with an empty array", () => {
    const result = schema.safeParse([]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("works with z.enum schema", () => {
    const enumSchema = arrayParam(z.enum(["foo", "bar"]));
    const result = enumSchema.safeParse("foo");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["foo"]);
  });

  it("rejects element that does not match enum", () => {
    const enumSchema = arrayParam(z.enum(["foo", "bar"]));
    const result = enumSchema.safeParse("baz");
    expect(result.success).toBe(false);
  });

  it("handles array of valid enum values", () => {
    const enumSchema = arrayParam(z.enum(["foo", "bar"]));
    const result = enumSchema.safeParse(["foo", "bar"]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(["foo", "bar"]);
  });
});
