import type { ConfigValue } from "src/types/db/runtime-configs.types";

import { config } from "@bunstack/shared/config";

/**
 * Helper to extract default value from nested appConfig object.
 * Traverses the configuration tree using dot notation to find the default value.
 * @param key - The configuration key in dot notation (e.g., "authentication.register")
 * @returns The default configuration value, or undefined if the key is not found
 */
export function getDefaultConfigValue(key: string): ConfigValue | null {
  const parts = key.split(".");
  let current: Record<string, unknown> = config;

  for (const part of parts) {
    const next = current[part];
    if (next === null || next === undefined) {
      return null;
    }
    current = next as Record<string, unknown>;
  }

  const result = current as { default?: ConfigValue };
  return result.default ?? null;
}
