import { ENV } from "varlock/env";

import { createClientI18n } from "~shared/i18n";

const i18n = createClientI18n();

function unflatten(entries: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(entries)) {
    const parts = path.split(".");
    let node = result;
    for (const part of parts.slice(0, -1)) {
      node = (node[part] ??= {}) as Record<string, unknown>;
    }
    node[parts[parts.length - 1]!] = value;
  }
  return result;
}

/**
 * Layer this organization's wording overrides onto the bundled resources.
 * Failures are silent — the bundled defaults always apply (platform surface,
 * offline, or an org without overrides).
 */
export async function applyOrgWordingOverrides(locale: string): Promise<void> {
  try {
    const res = await fetch(`${ENV.VITE_API_URL}/organization/translations/${locale}`, { credentials: "include" });
    if (!res.ok) return;

    const body = await res.json();
    for (const [namespace, entries] of Object.entries((body?.overrides ?? {}) as Record<string, Record<string, string>>)) {
      i18n.addResourceBundle(locale, namespace, unflatten(entries), true, true);
    }
  } catch {
    // Bundled defaults apply
  }
}

export default i18n;
