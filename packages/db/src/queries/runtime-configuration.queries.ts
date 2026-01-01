// ============================================================================
// Core CRUD Operations
// ============================================================================

import { eq } from "drizzle-orm";

import { drizzle } from "@/database";
import { RuntimeConfigModel } from "@bunstack/shared/models/runtime-config.model";

/**
 * Get all runtime-configurations.
 * @returns The runtime-configurations.
 */
export async function getRuntimeConfigurations(_keys?: string[]) {
  const runtimeConfigs = await drizzle
    .select()
    .from(RuntimeConfigModel);

  return runtimeConfigs;
}

/**
 * Get a runtime-configuration by key.
 * @param key - The runtime-configuration key
 * @returns The runtime-configuration.
 */
export async function getRuntimeConfiguration(key: string) {
  const [runtimeConfig] = await drizzle
    .select()
    .from(RuntimeConfigModel)
    .where(eq(RuntimeConfigModel.configKey, key));

  if (!runtimeConfig) {
    return null;
  }

  return runtimeConfig;
}

/**
 *
 */
export async function updateRuntimeConfiguration() {

}
