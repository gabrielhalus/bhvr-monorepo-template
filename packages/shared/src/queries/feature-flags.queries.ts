import type { FeatureFlagKey } from "../feature-flags.registry";
import type { OrgId } from "../types/org.types";

import { and, eq, isNull } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { FEATURE_FLAG_CACHE_TTL_SECONDS, getFeatureFlagCacheAdapter } from "../feature-flag-cache";
import { FEATURE_FLAGS, FEATURE_FLAGS_MAP } from "../feature-flags.registry";
import { FeatureFlagOverridesModel } from "../models/feature-flag-overrides.model";

export type ResolvedFeatureFlags = Record<FeatureFlagKey, boolean>;

function cacheKey(orgId: OrgId | null): string {
  return orgId ?? "platform";
}

/**
 * Resolve every flag for a scope: org override → platform-wide override →
 * registry default. Served from the flag cache when an adapter is registered.
 * @param orgId - The organization, or null for the platform view.
 * @returns The resolved flag map.
 */
export async function resolveFeatureFlags(orgId: OrgId | null): Promise<ResolvedFeatureFlags> {
  const cache = getFeatureFlagCacheAdapter();

  if (cache) {
    try {
      const cached = await cache.get(cacheKey(orgId));
      if (cached) {
        return JSON.parse(cached) as ResolvedFeatureFlags;
      }
    } catch {
      // Cache unavailable or corrupt entry — fall back to the database
    }
  }

  const overrides = await drizzle
    .select()
    .from(FeatureFlagOverridesModel)
    .where(orgId
      ? eq(FeatureFlagOverridesModel.organizationId, orgId)
      : isNull(FeatureFlagOverridesModel.organizationId));

  // Org view also needs the platform-wide rows as the middle layer
  const platformOverrides = orgId
    ? await drizzle
        .select()
        .from(FeatureFlagOverridesModel)
        .where(isNull(FeatureFlagOverridesModel.organizationId))
    : overrides;

  const platformByKey = new Map(platformOverrides.map(o => [o.flagKey, o.enabled]));
  const orgByKey = orgId ? new Map(overrides.map(o => [o.flagKey, o.enabled])) : new Map<string, boolean>();

  const resolved = Object.fromEntries(FEATURE_FLAGS.map((entry) => {
    const orgValue = entry.scope === "organization" ? orgByKey.get(entry.key) : undefined;
    const platformValue = platformByKey.get(entry.key);
    return [entry.key, orgValue ?? platformValue ?? entry.defaultEnabled];
  })) as ResolvedFeatureFlags;

  cache?.set(cacheKey(orgId), JSON.stringify(resolved), FEATURE_FLAG_CACHE_TTL_SECONDS).catch(() => {});

  return resolved;
}

/**
 * Check whether a feature is enabled for a scope.
 * @param key - The flag key.
 * @param orgId - The organization, or null for the platform view.
 * @returns True when enabled.
 */
export async function isFeatureEnabled(key: FeatureFlagKey, orgId: OrgId | null): Promise<boolean> {
  const flags = await resolveFeatureFlags(orgId);
  return flags[key] ?? FEATURE_FLAGS_MAP.get(key)?.defaultEnabled ?? false;
}

/**
 * Upsert a flag override (platform-wide when orgId is null) and invalidate
 * the affected cache scopes.
 * @param key - The flag key.
 * @param orgId - The organization, or null for a platform-wide override.
 * @param enabled - The forced value, or null to remove the override.
 * @param updatedBy - The user making the change.
 */
export async function setFeatureFlagOverride(key: FeatureFlagKey, orgId: OrgId | null, enabled: boolean | null, updatedBy: string): Promise<void> {
  const scopeCondition = orgId
    ? eq(FeatureFlagOverridesModel.organizationId, orgId)
    : isNull(FeatureFlagOverridesModel.organizationId);

  if (enabled === null) {
    await drizzle
      .delete(FeatureFlagOverridesModel)
      .where(and(eq(FeatureFlagOverridesModel.flagKey, key), scopeCondition));
  } else {
    await drizzle
      .insert(FeatureFlagOverridesModel)
      .values({ flagKey: key, organizationId: orgId, enabled, updatedBy })
      .onConflictDoUpdate({
        target: [FeatureFlagOverridesModel.flagKey, FeatureFlagOverridesModel.organizationId],
        set: { enabled, updatedAt: new Date().toISOString(), updatedBy },
      });
  }

  try {
    // A platform-wide change affects every org's resolved view; without a
    // scan we rely on the TTL for org entries and drop the platform one.
    await getFeatureFlagCacheAdapter()?.remove([cacheKey(orgId)]);
  } catch {
    // Stale entries expire via TTL
  }
}
