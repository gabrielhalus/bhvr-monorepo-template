import type { OrgId } from "../types/org.types";

import { and, eq } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OrganizationTranslationsModel } from "../models/organization-translations.model";
import { getTranslationCacheAdapter, TRANSLATION_CACHE_TTL_SECONDS } from "../translation-cache";
import { orgScope } from "./scope";

/** Overrides-only bundle: { namespace: { "dot.path": value } } */
export type TranslationOverrides = Record<string, Record<string, string>>;

function cacheKey(orgId: OrgId, locale: string): string {
  return `${orgId}:${locale}`;
}

/**
 * Get an organization's translation overrides for a locale, grouped by
 * namespace. Served from the translation cache when an adapter is registered.
 * @param orgId - The organization id.
 * @param locale - The locale (e.g. "en").
 * @returns The overrides bundle (empty when none).
 */
export async function getTranslationOverrides(orgId: OrgId, locale: string): Promise<TranslationOverrides> {
  const cache = getTranslationCacheAdapter();

  if (cache) {
    try {
      const cached = await cache.get(cacheKey(orgId, locale));
      if (cached) {
        return JSON.parse(cached) as TranslationOverrides;
      }
    } catch {
      // Cache unavailable or corrupt entry — fall back to the database
    }
  }

  const rows = await drizzle
    .select()
    .from(OrganizationTranslationsModel)
    .where(orgScope(OrganizationTranslationsModel, orgId, eq(OrganizationTranslationsModel.locale, locale)));

  const overrides: TranslationOverrides = {};
  for (const row of rows) {
    (overrides[row.namespace] ??= {})[row.key] = row.value;
  }

  cache?.set(cacheKey(orgId, locale), JSON.stringify(overrides), TRANSLATION_CACHE_TTL_SECONDS).catch(() => {});

  return overrides;
}

/**
 * Upsert a translation override, or remove it when value is null (back to
 * the bundled default). Invalidates the affected cache entry.
 * @param orgId - The organization id.
 * @param locale - The locale.
 * @param namespace - The i18n namespace (e.g. "web").
 * @param key - The dot-path within the namespace.
 * @param value - The overridden wording, or null to reset.
 * @param updatedBy - The user making the change.
 */
export async function setTranslationOverride(orgId: OrgId, locale: string, namespace: string, key: string, value: string | null, updatedBy: string): Promise<void> {
  if (value === null) {
    await drizzle
      .delete(OrganizationTranslationsModel)
      .where(and(
        eq(OrganizationTranslationsModel.organizationId, orgId),
        eq(OrganizationTranslationsModel.locale, locale),
        eq(OrganizationTranslationsModel.namespace, namespace),
        eq(OrganizationTranslationsModel.key, key),
      ));
  } else {
    const now = new Date().toISOString();
    await drizzle
      .insert(OrganizationTranslationsModel)
      .values({ organizationId: orgId, locale, namespace, key, value, updatedAt: now, updatedBy })
      .onConflictDoUpdate({
        target: [
          OrganizationTranslationsModel.organizationId,
          OrganizationTranslationsModel.locale,
          OrganizationTranslationsModel.namespace,
          OrganizationTranslationsModel.key,
        ],
        set: { value, updatedAt: now, updatedBy },
      });
  }

  try {
    await getTranslationCacheAdapter()?.remove([cacheKey(orgId, locale)]);
  } catch {
    // Stale entry expires via TTL
  }
}
