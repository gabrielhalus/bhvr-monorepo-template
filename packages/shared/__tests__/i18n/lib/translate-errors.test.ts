import type { TFunction } from "i18next";

import { describe, expect, it, mock } from "bun:test";

import { translateErrors } from "~shared/i18n/lib/translate-errors";

const mockT = mock((key: string) => `translated:${key}`) as unknown as TFunction;

describe("translateErrors", () => {
  it("translates errors whose message starts with 'errors.'", () => {
    const errors = [{ message: "errors.required" }];
    const result = translateErrors(errors, mockT);
    expect(result[0]?.message).toBe("translated:errors.required");
  });

  it("leaves messages that do not start with 'errors.' unchanged", () => {
    const errors = [{ message: "Something went wrong" }];
    const result = translateErrors(errors, mockT);
    expect(result[0]?.message).toBe("Something went wrong");
  });

  it("leaves undefined error entries unchanged", () => {
    const errors = [undefined];
    const result = translateErrors(errors, mockT);
    expect(result[0]).toBeUndefined();
  });

  it("leaves error entries without a message unchanged", () => {
    const errors = [{}];
    const result = translateErrors(errors, mockT);
    expect(result[0]).toEqual({});
  });

  it("handles a mixed array of error types", () => {
    const errors = [
      { message: "errors.minLength" },
      { message: "Custom error" },
      undefined,
      {},
    ];
    const result = translateErrors(errors, mockT);
    expect(result[0]?.message).toBe("translated:errors.minLength");
    expect(result[1]?.message).toBe("Custom error");
    expect(result[2]).toBeUndefined();
    expect(result[3]).toEqual({});
  });

  it("returns an empty array for empty input", () => {
    expect(translateErrors([], mockT)).toEqual([]);
  });

  it("preserves other properties on the error object when translating", () => {
    const errors = [{ message: "errors.invalid", code: "ERR001" }];
    const result = translateErrors(errors, mockT) as Array<{ message?: string; code?: string }>;
    expect(result[0]?.code).toBe("ERR001");
    expect(result[0]?.message).toBe("translated:errors.invalid");
  });

  it("does not translate a message that contains 'errors.' but not at the start", () => {
    const errors = [{ message: "prefix:errors.something" }];
    const result = translateErrors(errors, mockT);
    expect(result[0]?.message).toBe("prefix:errors.something");
  });
});
