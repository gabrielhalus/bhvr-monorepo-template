import type { ConfigRegistryEntry } from "../config.registry";
import type { Config, ConfigValue } from "../types/db/configs.types";

import { eq, inArray } from "drizzle-orm";

import { CONFIG_REGISTRY, CONFIG_REGISTRY_MAP } from "../config.registry";
import { drizzle } from "../drizzle";
import { ConfigModel } from "../models/configs.model";

type DbOverride = typeof ConfigModel.$inferSelect;

function mergeConfig(entry: ConfigRegistryEntry, override?: DbOverride): Config {
  return {
    configKey: entry.key,
    value: override !== undefined ? override.value : entry.defaultValue,
    defaultValue: entry.defaultValue,
    isOverridden: override !== undefined,
    type: entry.type,
    nullable: entry.nullable,
    multiline: entry.multiline,
    secret: entry.secret,
    rotatable: entry.rotatable,
    options: entry.options,
    disabledWhen: entry.disabledWhen,
    order: entry.order,
    updatedAt: override?.updatedAt ?? null,
    updatedBy: override?.updatedBy ?? null,
  };
}

/**
 * Get all configurations merged with their registry defaults.
 * @param keys - Optional array of configuration keys to filter by.
 * @returns The configurations.
 */
export async function getConfigs(keys?: string[]): Promise<Config[]> {
  const entries = keys
    ? keys.flatMap(k => CONFIG_REGISTRY_MAP.has(k) ? [CONFIG_REGISTRY_MAP.get(k)!] : [])
    : CONFIG_REGISTRY;

  if (entries.length === 0) return [];

  const entryKeys = entries.map(e => e.key);
  const overrides = await drizzle
    .select()
    .from(ConfigModel)
    .where(inArray(ConfigModel.configKey, entryKeys));

  const overrideMap = new Map(overrides.map(o => [o.configKey, o]));
  return entries.map(entry => mergeConfig(entry, overrideMap.get(entry.key)));
}

/**
 * Get a configuration by key, merged with its registry default.
 * @param key - The configuration key.
 * @returns The configuration, or null if the key is not in the registry.
 */
export async function getConfig(key: string): Promise<Config | null> {
  const entry = CONFIG_REGISTRY_MAP.get(key);
  if (!entry) return null;

  const [override] = await drizzle
    .select()
    .from(ConfigModel)
    .where(eq(ConfigModel.configKey, key));

  return mergeConfig(entry, override);
}

/**
 * Upsert a configuration override.
 * @param key - The configuration key.
 * @param value - The value to set.
 * @param updatedBy - The user ID of the user updating the configuration.
 * @returns The updated configuration merged with registry defaults.
 * @throws An error if the key is not in the registry.
 */
export async function updateConfig(key: string, value: ConfigValue, updatedBy: string): Promise<Config> {
  const entry = CONFIG_REGISTRY_MAP.get(key);
  if (!entry) throw new Error(`Configuration '${key}' not found`);

  const stringValue = value !== null ? String(value) : null;

  if (stringValue === entry.defaultValue) {
    await drizzle.delete(ConfigModel).where(eq(ConfigModel.configKey, key));
    return mergeConfig(entry);
  }

  const now = new Date().toISOString();

  await drizzle
    .insert(ConfigModel)
    .values({ configKey: key, value: stringValue, updatedAt: now, updatedBy })
    .onConflictDoUpdate({
      target: ConfigModel.configKey,
      set: { value: stringValue, updatedAt: now, updatedBy },
    });

  return mergeConfig(entry, { configKey: key, value: stringValue, updatedAt: now, updatedBy });
}
