import type { ConfigValue, RuntimeConfig } from "../types/db/runtime-configs.types";

import { asc, eq, inArray, sql } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { RuntimeConfigModel } from "../models/runtime-configs.model";
import { RuntimeConfigSchema } from "../schemas/db/runtime-configs.schemas";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all runtime-configurations.
 * @param keys - Optional array of runtime-configuration keys to filter by.
 * @returns The runtime-configurations.
 */
export async function getRuntimeConfigs(keys?: string[]): Promise<RuntimeConfig[]> {
  const runtimeConfigs = await drizzle
    .select()
    .from(RuntimeConfigModel)
    .where(keys ? inArray(RuntimeConfigModel.configKey, keys) : undefined)
    .orderBy(
      asc(sql<unknown>`regexp_replace(${RuntimeConfigModel.configKey}, '\\.[^.]+$', '')`), // parent path (everything except last segment)
      asc(sql<unknown>`CASE WHEN ${RuntimeConfigModel.configKey} ~ '\\.' THEN 1 ELSE 0 END`), // parent vs leaf: parent fisrt
      asc(RuntimeConfigModel.order), // leafs order
    );

  return runtimeConfigs.map(rc => RuntimeConfigSchema.parse(rc));
}

/**
 * Get a runtime-configuration by key.
 * @param key - The runtime-configuration key.
 * @returns The runtime-configuration.
 */
export async function getRuntimeConfig(key: string): Promise<RuntimeConfig | null> {
  const [runtimeConfig] = await drizzle
    .select()
    .from(RuntimeConfigModel)
    .where(eq(RuntimeConfigModel.configKey, key));

  if (!runtimeConfig) {
    return null;
  }

  return RuntimeConfigSchema.parse(runtimeConfig);
}

/**
 * Update a runtime-configuration.
 * @param key - The runtime-configuration key.
 * @param value - The value to update.
 * @param updatedBy - The user ID of the user updating the configuration.
 * @returns The updated runtime-configuration.
 * @throws An error if the runtime-configuration could not be updated.
 */
export async function updateRuntimeConfig(key: string, value: ConfigValue, updatedBy: string): Promise<RuntimeConfig> {
  const [updatedRuntimeConfig] = await drizzle
    .update(RuntimeConfigModel)
    .set({ value: String(value), updatedAt: new Date().toISOString(), updatedBy })
    .where(eq(RuntimeConfigModel.configKey, key))
    .returning();

  if (!updatedRuntimeConfig) {
    throw new Error(`Runtime configuration '${key}' not found`);
  }

  return RuntimeConfigSchema.parse(updatedRuntimeConfig);
}
