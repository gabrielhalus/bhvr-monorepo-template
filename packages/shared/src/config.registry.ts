export type ConfigRegistryEntry = {
  key: string;
  type: "string" | "number" | "boolean" | "list" | "node" | "image";
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
  // ── Security ──────────────────────────────────────────────────────────────
  { key: "security", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "security.jwt", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "security.jwt.secret", type: "string", defaultValue: null, nullable: false, multiline: false, secret: true, rotatable: true, options: null, disabledWhen: null, order: 0 },

  // ── Authentication ─────────────────────────────────────────────────────────
  { key: "authentication", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.register", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.github", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "authentication.register.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google.clientId", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.google.enable!=true", order: 1 },
  { key: "authentication.google.clientSecret", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: "authentication.google.enable!=true", order: 2 },
  { key: "authentication.github.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.github.clientId", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.github.enable!=true", order: 1 },
  { key: "authentication.github.clientSecret", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: "authentication.github.enable!=true", order: 2 },

  // ── Branding ───────────────────────────────────────────────────────────────
  { key: "branding", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "branding.appName", type: "string", defaultValue: "Bunstack.", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "branding.appCaption", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "branding.logoUrl", type: "image", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "branding.faviconUrl", type: "image", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "branding.primaryColor", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "branding.loginHeroTitle", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 5 },
  { key: "branding.loginHeroSubtitle", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 6 },

  // ── Email ──────────────────────────────────────────────────────────────────
  { key: "email", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "email.apiKey", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "email.fromAddress", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "email.fromName", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },

  // ── Storage ────────────────────────────────────────────────────────────────
  { key: "storage", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "storage.s3", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "storage.s3.endpoint", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "storage.s3.accessKey", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "storage.s3.secretKey", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "storage.s3.bucket", type: "string", defaultValue: "documents", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "storage.s3.region", type: "string", defaultValue: "us-east-1", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
];

export const CONFIG_REGISTRY_MAP = new Map<string, ConfigRegistryEntry>(
  CONFIG_REGISTRY.map(entry => [entry.key, entry]),
);
