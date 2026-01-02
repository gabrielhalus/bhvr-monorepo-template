import type { ConfigValue } from "../types/runtime-config.types";
import type { WithRelations } from "./type-utils";

import { z } from "zod";

/**
 * Attach a relation to a target.
 * @param target - The target to attach the relation to.
 * @param key - The key of the relation to attach.
 * @param value - The value of the relation to attach.
 */
export function attachRelation<
  TBase extends Record<PropertyKey, unknown>,
  TRelations extends Record<PropertyKey, unknown>,
  TKeys extends (keyof TRelations)[],
  K extends TKeys[number],
>(
  target: WithRelations<TBase, TRelations, TKeys>,
  key: K,
  value: TRelations[K],
): void {
  (target as Record<K, TRelations[K]>)[key] = value;
}

/**
 * Ensures query param is always an array
 * @param schema - The Zod schema to validate each array element
 * @returns A Zod schema that always returns an optional array
 */
export function arrayParam<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (val) => {
      if (Array.isArray(val))
        return val;
      if (val !== undefined && val !== null)
        return [val];
      return undefined;
    },
    z.array(schema).optional(),
  );
}

/**
 * Infers and parses a configuration value from its string representation.
 * Attempts to parse the value as JSON to handle booleans, numbers, arrays, and objects.
 * Falls back to returning the original string if parsing fails.
 *
 * @param value - The string value to parse
 * @returns The parsed value (string, number, boolean, array, or object)
 */
export function inferConfigValue(value: string): ConfigValue {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
