import type { Condition, Operand } from "~shared/types/auth.types";
import type { User } from "~shared/types/db/users.types";

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    return (acc as Record<string, unknown>)?.[part];
  }, obj);
}

export function resolveOperand(operand: Operand, user: User, resource?: Record<string, unknown>): unknown {
  switch (operand.type) {
    case "user_attr":
      return getNested(user, operand.key);
    case "resource_attr":
      return getNested(resource, operand.key);
    case "literal":
      return operand.value;
  }
}

export function evaluateCondition(condition: string | Condition, user: User, resource?: Record<string, unknown>): boolean {
  const cond = typeof condition === "string" ? (JSON.parse(condition) as Condition) : condition;

  switch (cond.op) {
    case "and":
      return cond.conditions.every(c => evaluateCondition(c, user, resource));
    case "or":
      return cond.conditions.some(c => evaluateCondition(c, user, resource));
    case "not":
      return !evaluateCondition(cond.condition, user, resource);

    case "eq":
      return resolveOperand(cond.left, user, resource) === resolveOperand(cond.right, user, resource);
    case "neq":
      return resolveOperand(cond.left, user, resource) !== resolveOperand(cond.right, user, resource);
    case "lt":
      return (resolveOperand(cond.left, user, resource) as number) < (resolveOperand(cond.right, user, resource) as number);
    case "lte":
      return (resolveOperand(cond.left, user, resource) as number) <= (resolveOperand(cond.right, user, resource) as number);
    case "gt":
      return (resolveOperand(cond.left, user, resource) as number) > (resolveOperand(cond.right, user, resource) as number);
    case "gte":
      return (resolveOperand(cond.left, user, resource) as number) >= (resolveOperand(cond.right, user, resource) as number);

    case "in": {
      const left = resolveOperand(cond.left, user, resource);
      return cond.right.some(r => left === resolveOperand(r, user, resource));
    }
    case "not_in": {
      const left = resolveOperand(cond.left, user, resource);
      return cond.right.every(r => left !== resolveOperand(r, user, resource));
    }

    case "exists": {
      const value = resolveOperand(cond.operand, user, resource);
      return value !== undefined && value !== null;
    }
    case "not_exists": {
      const value = resolveOperand(cond.operand, user, resource);
      return value === undefined || value === null;
    }

    default:
      throw new Error(`Unsupported condition operator: ${(cond as { op: string }).op}`);
  }
}
