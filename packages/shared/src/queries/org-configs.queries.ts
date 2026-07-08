import type { Config, ConfigValue } from "../types/db/configs.types";
import type { OrgId } from "../types/org.types";

import { and, eq, inArray } from "drizzle-orm";

import { CONFIG_REGISTRY_MAP } from "../config.registry";
import { drizzle } from "../drizzle";
import { OrgConfigsModel } from "../models/org-configs.model";
import { getConfig, getConfigs } from "./configs.queries";
import { orgScope } from "./scope";

/**
 * Get configurations as seen from an organization: platform resolution
 * (override → default) for platform-scoped keys, plus the org's own override
 * layered on top for organization-scoped keys.
 * @param orgId - The organization id.
 * @param keys - Optional array of configuration keys to filter by.
 * @returns The configurations.
 */
export async function getOrgConfigs(orgId: OrgId, keys?: string[]): Promise<Config[]> {
  const configs = await getConfigs(keys);

  const orgKeys = configs.filter(c => c.scope === "organization").map(c => c.configKey);
  if (orgKeys.length === 0) {
    return configs;
  }

  const overrides = await drizzle
    .select()
    .from(OrgConfigsModel)
    .where(orgScope(OrgConfigsModel, orgId, inArray(OrgConfigsModel.configKey, orgKeys)));

  const overrideByKey = new Map(overrides.map(o => [o.configKey, o]));

  return configs.map((config) => {
    const override = config.scope === "organization" ? overrideByKey.get(config.configKey) : undefined;
    if (!override) {
      return config;
    }

    return {
      ...config,
      value: override.value,
      isOverridden: true,
      updatedAt: override.updatedAt,
      updatedBy: override.updatedBy,
    };
  });
}

/**
 * Get a configuration by key as seen from an organization.
 * @param orgId - The organization id.
 * @param key - The configuration key.
 * @returns The configuration, or null if the key is not in the registry.
 */
export async function getOrgConfig(orgId: OrgId, key: string): Promise<Config | null> {
  const [config] = await getOrgConfigs(orgId, [key]);
  return config ?? null;
}

/**
 * Upsert an organization's configuration override. Only organization-scoped
 * keys can be written; setting a key back to its platform-resolved value
 * removes the override.
 * @param orgId - The organization id.
 * @param key - The configuration key.
 * @param value - The value to set.
 * @param updatedBy - The user ID of the user updating the configuration.
 * @returns The updated configuration as seen from the organization.
 * @throws An error if the key is not in the registry or not org-scoped.
 */
export async function updateOrgConfig(orgId: OrgId, key: string, value: ConfigValue, updatedBy: string): Promise<Config> {
  const entry = CONFIG_REGISTRY_MAP.get(key);
  if (!entry) throw new Error(`Configuration '${key}' not found`);
  if (entry.scope !== "organization") throw new Error(`Configuration '${key}' is platform-scoped`);

  const stringValue = value !== null ? String(value) : null;
  const platformResolved = await getConfig(key);

  if (stringValue === (platformResolved?.value ?? entry.defaultValue)) {
    await drizzle
      .delete(OrgConfigsModel)
      .where(and(eq(OrgConfigsModel.organizationId, orgId), eq(OrgConfigsModel.configKey, key)));

    return (await getOrgConfig(orgId, key))!;
  }

  const now = new Date().toISOString();

  await drizzle
    .insert(OrgConfigsModel)
    .values({ organizationId: orgId, configKey: key, value: stringValue, updatedAt: now, updatedBy })
    .onConflictDoUpdate({
      target: [OrgConfigsModel.organizationId, OrgConfigsModel.configKey],
      set: { value: stringValue, updatedAt: now, updatedBy },
    });

  return (await getOrgConfig(orgId, key))!;
}
