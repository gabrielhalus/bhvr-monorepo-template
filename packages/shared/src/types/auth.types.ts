import type { UserWithRelations } from "./users.types";

export type Operand
  = | { type: "user_attr"; key: string }
    | { type: "resource_attr"; key: string }
    | { type: "literal"; value: unknown };

export type Condition
  = | { op: "and"; conditions: Condition[] }
    | { op: "or"; conditions: Condition[] }
    | { op: "not"; condition: Condition }
    | { op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte"; left: Operand; right: Operand }
    | { op: "in" | "not_in"; left: Operand; right: Operand[] }
    | { op: "exists" | "not_exists"; operand: Operand };

export type Session = {
  user: UserWithRelations<["roles"]>;
  authenticated: true;
};

export type PasswordRules = {
  minLength: number;
  minUppercase: number;
  minLowercase: number;
  minDigits: number;
  minSpecialChars: number;
};
