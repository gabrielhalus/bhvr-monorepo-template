import type { Config, ConfigValue } from "../types/db/configs.types";

import { asc, eq, inArray, sql } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { ConfigModel } from "../models/configs.model";
import { ConfigSchema } from "../schemas/db/configs.schemas";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all configurations.
 * @param keys - Optional array of configuration keys to filter by.
 * @returns The configurations.
 */
export async function getConfigs(keys?: string[]): Promise<Config[]> {
  const configs = await drizzle
    .select()
    .from(ConfigModel)
    .where(keys ? inArray(ConfigModel.configKey, keys) : undefined)
    .orderBy(
      asc(sql<unknown>`regexp_replace(${ConfigModel.configKey}, '\\.[^.]+$', '')`), // parent path (everything except last segment)
      asc(sql<unknown>`CASE WHEN ${ConfigModel.configKey} ~ '\\.' THEN 1 ELSE 0 END`), // parent vs leaf: parent fisrt
      asc(ConfigModel.order), // leafs order
    );

  return configs.map(rc => ConfigSchema.parse(rc));
}

/**
 * Get a configuration by key.
 * @param key - The configuration key.
 * @returns The configuration.
 */
export async function getConfig(key: string): Promise<Config | null> {
  const [config] = await drizzle
    .select()
    .from(ConfigModel)
    .where(eq(ConfigModel.configKey, key));

  if (!config) {
    return null;
  }

  return ConfigSchema.parse(config);
}

/**
 * Update a configuration.
 * @param key - The configuration key.
 * @param value - The value to update.
 * @param updatedBy - The user ID of the user updating the configuration.
 * @returns The updated configuration.
 * @throws An error if the configuration could not be updated.
 */
export async function updateConfig(key: string, value: ConfigValue, updatedBy: string): Promise<Config> {
  const [updatedConfig] = await drizzle
    .update(ConfigModel)
    .set({ value: value !== null ? String(value) : null, updatedAt: new Date().toISOString(), updatedBy })
    .where(eq(ConfigModel.configKey, key))
    .returning();

  if (!updatedConfig) {
    throw new Error(`Configuration '${key}' not found`);
  }

  return ConfigSchema.parse(updatedConfig);
}
