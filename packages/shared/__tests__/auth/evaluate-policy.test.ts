import type { Policy } from "~shared/types/db/policies.types";
import type { User } from "~shared/types/db/users.types";

import { describe, expect, it } from "bun:test";

import { evaluatePolicies } from "~shared/auth/evaluate-policy";

const baseUser: User & { roles: any[] } = {
  id: "user_abc123",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  password: null,
  avatar: null,
  preferences: null,
  metadata: null,
  verifiedAt: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  roles: [],
};

const ts = "2024-01-01T00:00:00.000Z";

function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 1,
    effect: "allow",
    permission: "user:read",
    roleId: 1,
    condition: null,
    description: null,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

describe("evaluatePolicies", () => {
  it("returns 'none' for an empty policy list", () => {
    expect(evaluatePolicies([], "user:read", baseUser)).toBe("none");
  });

  it("returns 'none' when no policy matches the permission", () => {
    const policies = [makePolicy({ permission: "user:create" }), makePolicy({ permission: "user:delete" })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("none");
  });

  it("returns the effect when permission matches and there is no condition", () => {
    const policies = [makePolicy({ effect: "allow" })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("allow");
  });

  it("returns 'deny' when policy has deny effect and no condition", () => {
    const policies = [makePolicy({ effect: "deny" })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("deny");
  });

  it("returns the effect when condition is satisfied", () => {
    const condition = JSON.stringify({
      op: "eq",
      left: { type: "literal", value: 1 },
      right: { type: "literal", value: 1 },
    });
    const policies = [makePolicy({ condition })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("allow");
  });

  it("skips a policy whose condition is not satisfied", () => {
    const condition = JSON.stringify({
      op: "eq",
      left: { type: "literal", value: 1 },
      right: { type: "literal", value: 2 },
    });
    const policies = [makePolicy({ condition })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("none");
  });

  it("returns 'none' when matching permission but condition not satisfied", () => {
    const falseCondition = JSON.stringify({
      op: "eq",
      left: { type: "literal", value: "no" },
      right: { type: "literal", value: "yes" },
    });
    const policies = [makePolicy({ condition: falseCondition })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("none");
  });

  it("returns the first matching policy's effect", () => {
    const policies = [
      makePolicy({ effect: "allow", permission: "user:read" }),
      makePolicy({ effect: "deny", permission: "user:read" }),
    ];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("allow");
  });

  it("skips non-matching policies and returns first matching one", () => {
    const policies = [
      makePolicy({ permission: "user:create", effect: "allow" }),
      makePolicy({ permission: "user:read", effect: "deny" }),
    ];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("deny");
  });

  it("evaluates condition using user attributes", () => {
    const condition = JSON.stringify({
      op: "eq",
      left: { type: "user_attr", key: "id" },
      right: { type: "literal", value: "user_abc123" },
    });
    const policies = [makePolicy({ condition, effect: "allow" })];
    expect(evaluatePolicies(policies, "user:read", baseUser)).toBe("allow");
  });

  it("evaluates condition using resource attributes", () => {
    const condition = JSON.stringify({
      op: "eq",
      left: { type: "resource_attr", key: "ownerId" },
      right: { type: "user_attr", key: "id" },
    });
    const policies = [makePolicy({ condition, effect: "allow" })];
    const resource = { ownerId: "user_abc123" };
    expect(evaluatePolicies(policies, "user:read", baseUser, resource)).toBe("allow");
  });
});
