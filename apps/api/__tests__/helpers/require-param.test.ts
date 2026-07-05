import { describe, expect, it } from "bun:test";

import { requireParam } from "@/helpers/require-param";

function makeCtx(params: Record<string, string | undefined>) {
  return {
    req: {
      param: (key: string) => params[key],
    },
  };
}

describe("requireParam", () => {
  it("returns the parameter value when it exists", () => {
    const ctx = makeCtx({ id: "abc123" });
    expect(requireParam(ctx, "id")).toBe("abc123");
  });

  it("throws when the parameter is undefined", () => {
    const ctx = makeCtx({});
    expect(() => requireParam(ctx, "id")).toThrow("Missing route param: id");
  });

  it("includes the key name in the error message", () => {
    const ctx = makeCtx({});
    expect(() => requireParam(ctx, "userId")).toThrow("Missing route param: userId");
  });

  it("returns different parameters correctly", () => {
    const ctx = makeCtx({ userId: "u1", postId: "p2" });
    expect(requireParam(ctx, "userId")).toBe("u1");
    expect(requireParam(ctx, "postId")).toBe("p2");
  });

  it("throws when the parameter value is an empty string (falsy)", () => {
    const ctx = makeCtx({ id: "" });
    expect(() => requireParam(ctx, "id")).toThrow("Missing route param: id");
  });
});
