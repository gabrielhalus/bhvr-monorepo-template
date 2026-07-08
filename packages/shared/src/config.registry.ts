export type ConfigRegistryEntry = {
  key: string;
  type: "string" | "number" | "boolean" | "list" | "node" | "image";
  /**
   * Who owns the value: "platform" keys are edited from the admin app and
   * apply instance-wide; "organization" keys resolve per org
   * (org override → registry default). Boolean feature gates don't belong
   * here — they are feature flags (see feature-flags.registry.ts).
   */
  scope: "platform" | "organization";
  defaultValue: string | null;
  nullable: boolean;
  multiline: boolean;
  secret: boolean;
  rotatable: boolean;
  options: string | null;
  disabledWhen: string | null;
  order: number;
};

export const CONFIG_REGISTRY: ConfigRegistryEntry[] = [
  // ── Authentication ─────────────────────────────────────────────────────────
  { key: "authentication", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.register", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.github", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "authentication.sso", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "authentication.jwt", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "authentication.jwt.secret", type: "string", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: true, rotatable: true, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google.clientId", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.google.clientSecret", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "authentication.github.clientId", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.github.clientSecret", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "authentication.sso.issuerUrl", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.sso.clientId", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "authentication.sso.clientSecret", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "authentication.sso.scopes", type: "string", scope: "platform", defaultValue: "openid profile email", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "authentication.sso.buttonLabel", type: "string", scope: "platform", defaultValue: "SSO", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 5 },
  { key: "authentication.sso.autoLogin", type: "boolean", scope: "platform", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 6 },

  // ── Branding ───────────────────────────────────────────────────────────────
  { key: "branding", type: "node", scope: "organization", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "branding.appName", type: "string", scope: "organization", defaultValue: "Bunstack.", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "branding.appCaption", type: "string", scope: "organization", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "branding.logoUrl", type: "image", scope: "organization", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "branding.faviconUrl", type: "image", scope: "organization", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "branding.primaryColor", type: "string", scope: "organization", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "branding.loginHeroTitle", type: "string", scope: "organization", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 5 },
  { key: "branding.loginHeroSubtitle", type: "string", scope: "organization", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 6 },

  // ── Email ──────────────────────────────────────────────────────────────────
  { key: "email", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "email.apiKey", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "email.fromAddress", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "email.fromName", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },

  // ── Storage ────────────────────────────────────────────────────────────────
  { key: "storage", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "storage.s3", type: "node", scope: "platform", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "storage.s3.endpoint", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "storage.s3.accessKey", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "storage.s3.secretKey", type: "string", scope: "platform", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "storage.s3.bucket", type: "string", scope: "platform", defaultValue: "documents", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "storage.s3.region", type: "string", scope: "platform", defaultValue: "us-east-1", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
];

export const CONFIG_REGISTRY_MAP = new Map<string, ConfigRegistryEntry>(
  CONFIG_REGISTRY.map(entry => [entry.key, entry]),
);
