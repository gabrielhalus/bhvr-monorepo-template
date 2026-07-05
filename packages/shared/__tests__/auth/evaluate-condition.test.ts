import type { Condition } from "~shared/types/auth.types";
import type { User } from "~shared/types/db/users.types";

import { describe, expect, it } from "bun:test";

import { evaluateCondition, resolveOperand } from "~shared/auth/evaluate-condition";

const baseUser: User = {
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
};

const userWithAge = { ...baseUser, metadata: { age: 30, address: { city: "Paris" } } } as User;
const resource = { ownerId: "user_abc123", status: "active", count: 5 };

// ── resolveOperand ──────────────────────────────────────────────────────────

describe("resolveOperand", () => {
  it("returns literal value", () => {
    expect(resolveOperand({ type: "literal", value: 42 }, baseUser)).toBe(42);
    expect(resolveOperand({ type: "literal", value: "hello" }, baseUser)).toBe("hello");
    expect(resolveOperand({ type: "literal", value: null }, baseUser)).toBeNull();
  });

  it("resolves top-level user attribute", () => {
    expect(resolveOperand({ type: "user_attr", key: "id" }, baseUser)).toBe("user_abc123");
    expect(resolveOperand({ type: "user_attr", key: "email" }, baseUser)).toBe("alice@example.com");
  });

  it("resolves nested user attribute via dot notation", () => {
    expect(resolveOperand({ type: "user_attr", key: "metadata.age" }, userWithAge)).toBe(30);
    expect(resolveOperand({ type: "user_attr", key: "metadata.address.city" }, userWithAge)).toBe("Paris");
  });

  it("returns undefined for missing user attribute", () => {
    expect(resolveOperand({ type: "user_attr", key: "nonExistent" }, baseUser)).toBeUndefined();
    expect(resolveOperand({ type: "user_attr", key: "metadata.age" }, baseUser)).toBeUndefined();
  });

  it("resolves top-level resource attribute", () => {
    expect(resolveOperand({ type: "resource_attr", key: "ownerId" }, baseUser, resource)).toBe("user_abc123");
    expect(resolveOperand({ type: "resource_attr", key: "status" }, baseUser, resource)).toBe("active");
  });

  it("returns undefined for resource attribute when no resource provided", () => {
    expect(resolveOperand({ type: "resource_attr", key: "ownerId" }, baseUser)).toBeUndefined();
  });

  it("returns undefined for missing resource attribute", () => {
    expect(resolveOperand({ type: "resource_attr", key: "nonExistent" }, baseUser, resource)).toBeUndefined();
  });
});

// ── evaluateCondition ───────────────────────────────────────────────────────

describe("evaluateCondition", () => {
  // ── eq ──────────────────────────────────────────────────────────────────
  describe("eq operator", () => {
    it("returns true when operands are equal", () => {
      const cond: Condition = { op: "eq", left: { type: "user_attr", key: "id" }, right: { type: "literal", value: "user_abc123" } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when operands differ", () => {
      const cond: Condition = { op: "eq", left: { type: "user_attr", key: "id" }, right: { type: "literal", value: "other" } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  // ── neq ─────────────────────────────────────────────────────────────────
  describe("neq operator", () => {
    it("returns true when operands differ", () => {
      const cond: Condition = { op: "neq", left: { type: "user_attr", key: "id" }, right: { type: "literal", value: "other" } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when operands are equal", () => {
      const cond: Condition = { op: "neq", left: { type: "user_attr", key: "id" }, right: { type: "literal", value: "user_abc123" } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  // ── lt / lte ────────────────────────────────────────────────────────────
  describe("lt operator", () => {
    it("returns true when left < right", () => {
      const cond: Condition = { op: "lt", left: { type: "literal", value: 3 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when left >= right", () => {
      const cond: Condition = { op: "lt", left: { type: "literal", value: 5 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  describe("lte operator", () => {
    it("returns true when left <= right", () => {
      const eq: Condition = { op: "lte", left: { type: "literal", value: 5 }, right: { type: "literal", value: 5 } };
      const lt: Condition = { op: "lte", left: { type: "literal", value: 4 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(eq, baseUser)).toBe(true);
      expect(evaluateCondition(lt, baseUser)).toBe(true);
    });

    it("returns false when left > right", () => {
      const cond: Condition = { op: "lte", left: { type: "literal", value: 6 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  // ── gt / gte ────────────────────────────────────────────────────────────
  describe("gt operator", () => {
    it("returns true when left > right", () => {
      const cond: Condition = { op: "gt", left: { type: "literal", value: 6 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when left <= right", () => {
      const cond: Condition = { op: "gt", left: { type: "literal", value: 5 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  describe("gte operator", () => {
    it("returns true when left >= right", () => {
      const eq: Condition = { op: "gte", left: { type: "literal", value: 5 }, right: { type: "literal", value: 5 } };
      const gt: Condition = { op: "gte", left: { type: "literal", value: 6 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(eq, baseUser)).toBe(true);
      expect(evaluateCondition(gt, baseUser)).toBe(true);
    });

    it("returns false when left < right", () => {
      const cond: Condition = { op: "gte", left: { type: "literal", value: 4 }, right: { type: "literal", value: 5 } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  // ── in / not_in ─────────────────────────────────────────────────────────
  describe("in operator", () => {
    it("returns true when value is in the list", () => {
      const cond: Condition = {
        op: "in",
        left: { type: "user_attr", key: "id" },
        right: [{ type: "literal", value: "other" }, { type: "literal", value: "user_abc123" }],
      };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when value is not in the list", () => {
      const cond: Condition = {
        op: "in",
        left: { type: "user_attr", key: "id" },
        right: [{ type: "literal", value: "other" }, { type: "literal", value: "another" }],
      };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  describe("not_in operator", () => {
    it("returns true when value is not in the list", () => {
      const cond: Condition = {
        op: "not_in",
        left: { type: "user_attr", key: "id" },
        right: [{ type: "literal", value: "other" }, { type: "literal", value: "another" }],
      };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when value is in the list", () => {
      const cond: Condition = {
        op: "not_in",
        left: { type: "user_attr", key: "id" },
        right: [{ type: "literal", value: "user_abc123" }],
      };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  // ── exists / not_exists ─────────────────────────────────────────────────
  describe("exists operator", () => {
    it("returns true when operand resolves to a value", () => {
      const cond: Condition = { op: "exists", operand: { type: "user_attr", key: "id" } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when operand is undefined", () => {
      const cond: Condition = { op: "exists", operand: { type: "user_attr", key: "nonExistent" } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });

    it("returns false when operand is null", () => {
      const cond: Condition = { op: "exists", operand: { type: "user_attr", key: "avatar" } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  describe("not_exists operator", () => {
    it("returns true when operand is undefined", () => {
      const cond: Condition = { op: "not_exists", operand: { type: "user_attr", key: "nonExistent" } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns true when operand is null", () => {
      const cond: Condition = { op: "not_exists", operand: { type: "user_attr", key: "avatar" } };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when operand has a value", () => {
      const cond: Condition = { op: "not_exists", operand: { type: "user_attr", key: "id" } };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  // ── logical operators ────────────────────────────────────────────────────
  describe("and operator", () => {
    const trueCondition: Condition = { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 1 } };
    const falseCondition: Condition = { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 2 } };

    it("returns true when all conditions are true", () => {
      const cond: Condition = { op: "and", conditions: [trueCondition, trueCondition] };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when any condition is false", () => {
      const cond: Condition = { op: "and", conditions: [trueCondition, falseCondition] };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });

    it("returns true for empty conditions array", () => {
      const cond: Condition = { op: "and", conditions: [] };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });
  });

  describe("or operator", () => {
    const trueCondition: Condition = { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 1 } };
    const falseCondition: Condition = { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 2 } };

    it("returns true when at least one condition is true", () => {
      const cond: Condition = { op: "or", conditions: [falseCondition, trueCondition] };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });

    it("returns false when all conditions are false", () => {
      const cond: Condition = { op: "or", conditions: [falseCondition, falseCondition] };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });

    it("returns false for empty conditions array", () => {
      const cond: Condition = { op: "or", conditions: [] };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });
  });

  describe("not operator", () => {
    it("negates a true condition", () => {
      const inner: Condition = { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 1 } };
      const cond: Condition = { op: "not", condition: inner };
      expect(evaluateCondition(cond, baseUser)).toBe(false);
    });

    it("negates a false condition", () => {
      const inner: Condition = { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 2 } };
      const cond: Condition = { op: "not", condition: inner };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });
  });

  // ── nested conditions ────────────────────────────────────────────────────
  describe("nested conditions", () => {
    it("evaluates deeply nested conditions", () => {
      const cond: Condition = {
        op: "and",
        conditions: [
          { op: "or", conditions: [
            { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 2 } },
            { op: "eq", left: { type: "user_attr", key: "id" }, right: { type: "literal", value: "user_abc123" } },
          ] },
          { op: "not", condition: { op: "eq", left: { type: "literal", value: 1 }, right: { type: "literal", value: 2 } } },
        ],
      };
      expect(evaluateCondition(cond, baseUser)).toBe(true);
    });
  });

  // ── resource_attr in conditions ──────────────────────────────────────────
  describe("resource attributes in conditions", () => {
    it("resolves resource attributes", () => {
      const cond: Condition = {
        op: "eq",
        left: { type: "resource_attr", key: "ownerId" },
        right: { type: "user_attr", key: "id" },
      };
      expect(evaluateCondition(cond, baseUser, resource)).toBe(true);
    });
  });

  // ── string JSON condition ────────────────────────────────────────────────
  describe("string condition (JSON parsing)", () => {
    it("parses and evaluates a JSON string condition", () => {
      const condJson = JSON.stringify({
        op: "eq",
        left: { type: "user_attr", key: "id" },
        right: { type: "literal", value: "user_abc123" },
      });
      expect(evaluateCondition(condJson, baseUser)).toBe(true);
    });
  });

  // ── unknown operator ─────────────────────────────────────────────────────
  describe("unknown operator", () => {
    it("throws for unsupported operator", () => {
      const cond = { op: "unknown_op" } as unknown as Condition;
      expect(() => evaluateCondition(cond, baseUser)).toThrow("Unsupported condition operator: unknown_op");
    });
  });
});
