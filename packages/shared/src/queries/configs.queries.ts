import type { ConfigRegistryEntry } from "../config.registry";
import type { Config, ConfigValue } from "../types/db/configs.types";

import { eq, inArray } from "drizzle-orm";

import { CONFIG_CACHE_TTL_SECONDS, getConfigCacheAdapter } from "../config-cache";
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
 * Read cached configs for the given keys. Cache failures and corrupt entries
 * are treated as misses so reads fall back to the database.
 */
async function readConfigCache(keys: string[]): Promise<Map<string, Config>> {
  const cache = getConfigCacheAdapter();
  const cached = new Map<string, Config>();
  if (!cache) return cached;

  try {
    const hits = await cache.getMany(keys);
    for (const [key, serialized] of hits) {
      cached.set(key, JSON.parse(serialized) as Config);
    }
  } catch {
    // Cache unavailable or corrupt entry — fall back to the database
  }

  return cached;
}

/** Store merged configs in the cache, without blocking the read path. */
function writeConfigCache(configs: Config[]): void {
  const cache = getConfigCacheAdapter();
  if (!cache || configs.length === 0) return;

  const entries = new Map(configs.map(c => [c.configKey, JSON.stringify(c)]));
  cache.setMany(entries, CONFIG_CACHE_TTL_SECONDS).catch(() => {});
}

/**
 * Drop a key from the cache after a write. If the cache is unreachable the
 * stale entry survives until its TTL expires.
 */
async function invalidateConfigCache(key: string): Promise<void> {
  const cache = getConfigCacheAdapter();
  if (!cache) return;

  try {
    await cache.remove(key);
  } catch {
    // Stale entry expires via TTL
  }
}

/**
 * Get all configurations merged with their registry defaults.
 * Served from the config cache when an adapter is registered.
 * @param keys - Optional array of configuration keys to filter by.
 * @returns The configurations.
 */
export async function getConfigs(keys?: string[]): Promise<Config[]> {
  const entries = keys
    ? keys.flatMap(k => CONFIG_REGISTRY_MAP.has(k) ? [CONFIG_REGISTRY_MAP.get(k)!] : [])
    : CONFIG_REGISTRY;

  if (entries.length === 0) return [];

  const cached = await readConfigCache(entries.map(e => e.key));
  const missing = entries.filter(e => !cached.has(e.key));

  const fetched = new Map<string, Config>();
  if (missing.length > 0) {
    const overrides = await drizzle
      .select()
      .from(ConfigModel)
      .where(inArray(ConfigModel.configKey, missing.map(e => e.key)));

    const overrideMap = new Map(overrides.map(o => [o.configKey, o]));
    for (const entry of missing) {
      fetched.set(entry.key, mergeConfig(entry, overrideMap.get(entry.key)));
    }

    writeConfigCache([...fetched.values()]);
  }

  return entries.map(entry => (cached.get(entry.key) ?? fetched.get(entry.key))!);
}

/**
 * Get a configuration by key, merged with its registry default.
 * @param key - The configuration key.
 * @returns The configuration, or null if the key is not in the registry.
 */
export async function getConfig(key: string): Promise<Config | null> {
  const [config] = await getConfigs([key]);
  return config ?? null;
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
    await invalidateConfigCache(key);
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

  await invalidateConfigCache(key);

  return mergeConfig(entry, { configKey: key, value: stringValue, updatedAt: now, updatedBy });
}
