import type { ConfigValue } from "../types/runtime-config.types";

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
