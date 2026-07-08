/**
 * Feature flag registry — the source of truth for which flags exist.
 *
 * Rule of thumb: a flag is a boolean gate over a coded feature (the code path
 * exists and is switched on/off); a config is a value the feature reads.
 * DB overrides live in `feature_flag_overrides`: a row with organizationId
 * NULL overrides the default platform-wide, an org row overrides both.
 */
export type FeatureFlagEntry = {
  key: FeatureFlagKey;
  description: string;
  defaultEnabled: boolean;
  /** "organization" flags can be overridden per org; "platform" flags only platform-wide. */
  scope: "platform" | "organization";
};

export type FeatureFlagKey
  = | "invitations"
    | "api-keys"
    | "impersonation"
    | "registration"
    | "oauth-google"
    | "oauth-github"
    | "sso"
    | "backups"
    | "cron-ui";

export const FEATURE_FLAGS: FeatureFlagEntry[] = [
  { key: "invitations", description: "Invite members by email", defaultEnabled: true, scope: "organization" },
  { key: "api-keys", description: "Personal API keys", defaultEnabled: true, scope: "organization" },
  { key: "impersonation", description: "Admins can impersonate members", defaultEnabled: false, scope: "organization" },
  { key: "registration", description: "Open self-registration", defaultEnabled: false, scope: "organization" },
  { key: "oauth-google", description: "Sign-in with Google (credentials are platform configs)", defaultEnabled: false, scope: "organization" },
  { key: "oauth-github", description: "Sign-in with GitHub (credentials are platform configs)", defaultEnabled: false, scope: "organization" },
  { key: "sso", description: "OpenID Connect SSO (settings are platform configs)", defaultEnabled: false, scope: "organization" },
  { key: "backups", description: "Database backup management", defaultEnabled: true, scope: "platform" },
  { key: "cron-ui", description: "Cron task management UI", defaultEnabled: true, scope: "platform" },
];

export const FEATURE_FLAGS_MAP = new Map<FeatureFlagKey, FeatureFlagEntry>(
  FEATURE_FLAGS.map(entry => [entry.key, entry]),
);
