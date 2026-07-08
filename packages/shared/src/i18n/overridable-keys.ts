/**
 * Curated wording keys an organization can override from its settings UI.
 * The schema accepts any key (the DB stores arbitrary dot-paths), but the
 * editor only exposes this list — user-facing product wording, not UI chrome.
 */
export type OverridableI18nKey = {
  namespace: string;
  key: string;
  description: string;
};

export const OVERRIDABLE_I18N_KEYS: OverridableI18nKey[] = [
  { namespace: "auth", key: "login.title", description: "Login page title" },
  { namespace: "auth", key: "login.submit", description: "Login button label" },
  { namespace: "web", key: "home.title", description: "Dashboard home title" },
  { namespace: "web", key: "nav.home", description: "Navigation: home" },
  { namespace: "web", key: "users.title", description: "Members page title" },
  { namespace: "web", key: "roles.title", description: "Roles page title" },
];
