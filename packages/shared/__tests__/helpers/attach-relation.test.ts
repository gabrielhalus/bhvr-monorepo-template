import { describe, expect, it } from "bun:test";

import { attachRelation } from "~shared/helpers/attach-relation";

type Base = { id: string };
type Relations = { tags: string[]; owner: { name: string } };

describe("attachRelation", () => {
  it("attaches a simple relation to the target", () => {
    const target = { id: "1", tags: [] } as Base & { tags: Relations["tags"] };
    attachRelation<Base, Relations, ["tags"], "tags">(target, "tags", ["a", "b"]);
    expect((target as any).tags).toEqual(["a", "b"]);
  });

  it("attaches an object relation", () => {
    const target = { id: "1", owner: undefined } as any;
    attachRelation<Base, Relations, ["owner"], "owner">(target, "owner", { name: "Alice" });
    expect((target as any).owner).toEqual({ name: "Alice" });
  });

  it("overwrites an existing relation value", () => {
    const target = { id: "1", tags: ["old"] } as any;
    attachRelation<Base, Relations, ["tags"], "tags">(target, "tags", ["new"]);
    expect((target as any).tags).toEqual(["new"]);
  });

  it("can attach multiple relations sequentially", () => {
    const target = { id: "1" } as any;
    attachRelation<Base, Relations, ["tags"], "tags">(target, "tags", ["x"]);
    attachRelation<Base, Relations, ["owner"], "owner">(target, "owner", { name: "Bob" });
    expect((target as any).tags).toEqual(["x"]);
    expect((target as any).owner).toEqual({ name: "Bob" });
  });

  it("attaches an empty array relation", () => {
    const target = { id: "1" } as any;
    attachRelation<Base, Relations, ["tags"], "tags">(target, "tags", []);
    expect((target as any).tags).toEqual([]);
  });
});
