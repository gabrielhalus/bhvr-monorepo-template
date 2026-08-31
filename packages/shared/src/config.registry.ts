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
  // ── Authentication ─────────────────────────────────────────────────────────
  { key: "authentication", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.register", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 1 },
  { key: "authentication.github", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 2 },
  { key: "authentication.sso", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 3 },
  { key: "authentication.saml", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 4 },
  { key: "authentication.jwt", type: "node", defaultValue: null, nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 5 },
  { key: "authentication.jwt.secret", type: "string", defaultValue: null, nullable: false, multiline: false, secret: true, rotatable: true, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.register.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.google.clientId", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.google.enable!=true", order: 1 },
  { key: "authentication.google.clientSecret", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: "authentication.google.enable!=true", order: 2 },
  { key: "authentication.github.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.github.clientId", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.github.enable!=true", order: 1 },
  { key: "authentication.github.clientSecret", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: "authentication.github.enable!=true", order: 2 },
  { key: "authentication.sso.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.sso.issuerUrl", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.sso.enable!=true", order: 1 },
  { key: "authentication.sso.clientId", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.sso.enable!=true", order: 2 },
  { key: "authentication.sso.clientSecret", type: "string", defaultValue: null, nullable: true, multiline: false, secret: true, rotatable: false, options: null, disabledWhen: "authentication.sso.enable!=true", order: 3 },
  { key: "authentication.sso.scopes", type: "string", defaultValue: "openid profile email", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.sso.enable!=true", order: 4 },
  { key: "authentication.sso.identifier", type: "string", defaultValue: "email", nullable: false, multiline: false, secret: false, rotatable: false, options: "email;preferred_username;sub", disabledWhen: "authentication.sso.enable!=true", order: 5 },
  { key: "authentication.sso.buttonLabel", type: "string", defaultValue: "SSO", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.sso.enable!=true", order: 6 },
  { key: "authentication.sso.autoLogin", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.sso.enable!=true", order: 7 },

  // SAML 2.0. `idpCert` and the SP keypair are PEM blocks, hence multiline.
  // The attribute names default to the LDAP/X.500 OIDs, which is what most
  // enterprise IdPs emit; Azure AD and ADFS use the WS-Fed claim URIs instead.
  { key: "authentication.saml.enable", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: null, order: 0 },
  { key: "authentication.saml.entryPoint", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 1 },
  { key: "authentication.saml.idpIssuer", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 2 },
  { key: "authentication.saml.idpCert", type: "string", defaultValue: null, nullable: true, multiline: true, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 3 },
  { key: "authentication.saml.spEntityId", type: "string", defaultValue: null, nullable: true, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 4 },
  { key: "authentication.saml.identifier", type: "string", defaultValue: "nameID", nullable: false, multiline: false, secret: false, rotatable: false, options: "nameID;email;upn", disabledWhen: "authentication.saml.enable!=true", order: 5 },
  { key: "authentication.saml.attrEmail", type: "string", defaultValue: "urn:oid:0.9.2342.19200300.100.1.3", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 6 },
  { key: "authentication.saml.attrFirstName", type: "string", defaultValue: "urn:oid:2.5.4.42", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 7 },
  { key: "authentication.saml.attrLastName", type: "string", defaultValue: "urn:oid:2.5.4.4", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 8 },
  { key: "authentication.saml.signatureAlgorithm", type: "string", defaultValue: "sha256", nullable: false, multiline: false, secret: false, rotatable: false, options: "sha256;sha512", disabledWhen: "authentication.saml.enable!=true", order: 9 },
  { key: "authentication.saml.wantAssertionsSigned", type: "boolean", defaultValue: "true", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 10 },
  { key: "authentication.saml.wantAuthnResponseSigned", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 11 },
  { key: "authentication.saml.spPrivateKey", type: "string", defaultValue: null, nullable: true, multiline: true, secret: true, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 12 },
  { key: "authentication.saml.spCert", type: "string", defaultValue: null, nullable: true, multiline: true, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 13 },
  { key: "authentication.saml.buttonLabel", type: "string", defaultValue: "SAML", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 14 },
  { key: "authentication.saml.autoLogin", type: "boolean", defaultValue: "false", nullable: false, multiline: false, secret: false, rotatable: false, options: null, disabledWhen: "authentication.saml.enable!=true", order: 15 },

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
