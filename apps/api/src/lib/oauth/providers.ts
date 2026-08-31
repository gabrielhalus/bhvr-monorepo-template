import type { OAuth2ProviderId, OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { OAuth2Tokens } from "arctic";

import { CodeChallengeMethod, decodeIdToken, generateCodeVerifier, generateState, GitHub, Google, OAuth2Client } from "arctic";
import { ENV } from "varlock/env";

import { getConfig } from "~shared/queries/configs.queries";
import { OAUTH2_PROVIDER_IDS } from "~shared/schemas/api/oauth.schemas";

import { getDiscoveryDocument } from "./oidc-discovery";

export { generateCodeVerifier, generateState };
export { OAuth2RequestError } from "arctic";

/**
 * Profile shape shared by every provider after normalization.
 *
 * Names are nullable — plenty of providers expose none (an LDAP-backed realm
 * with no name claims, a GitHub account with an empty profile). The signup
 * flow collects them from the visitor instead of deriving a placeholder.
 */
export type NormalizedProfile = {
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

type OAuthProviderDef = {
  id: OAuth2ProviderId;
  usesPKCE: boolean;
  createAuthorizationURL: (clientId: string, clientSecret: string, state: string, codeVerifier: string | null) => URL | Promise<URL>;
  validateCode: (clientId: string, clientSecret: string, code: string, codeVerifier: string | null) => Promise<OAuth2Tokens>;
  fetchProfile: (tokens: OAuth2Tokens) => Promise<NormalizedProfile>;
};

function redirectUri(provider: OAuth2ProviderId): string {
  return `${ENV.API_URL}/auth/oauth/${provider}/callback`;
}

/**
 * Split a display name into first/last.
 *
 * A single-word name fills the first name only: the missing half is reported
 * as absent so the signup flow can ask for it, which beats duplicating the
 * one word into both fields.
 */
function splitName(name: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = parts;

  return {
    firstName: first ?? null,
    lastName: rest.join(" ") || null,
  };
}

type GoogleIdTokenClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

function GITHUB_API_HEADERS(accessToken: string) {
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "bunstack",
  };
}

type OIDCClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
};

/** Claims usable as the SSO identifier, mirroring the config registry options. */
const SSO_IDENTIFIER_CLAIMS = ["email", "preferred_username", "sub"] as const;
type SsoIdentifierClaim = (typeof SSO_IDENTIFIER_CLAIMS)[number];

/** Read the admin-configured issuer, scopes and identifier claim of the generic SSO provider. */
async function getSsoSettings(): Promise<{ issuerUrl: string; scopes: string[]; identifierClaim: SsoIdentifierClaim }> {
  const [issuerUrl, scopes, identifier] = await Promise.all([
    getConfig("authentication.sso.issuerUrl"),
    getConfig("authentication.sso.scopes"),
    getConfig("authentication.sso.identifier"),
  ]);

  if (!issuerUrl?.value) {
    throw new Error("SSO issuer URL is not configured");
  }

  const parsed = (scopes?.value ?? "").split(/\s+/).filter(Boolean);
  if (!parsed.includes("openid")) {
    parsed.unshift("openid");
  }

  const identifierClaim = SSO_IDENTIFIER_CLAIMS.find(claim => claim === identifier?.value) ?? "email";

  return { issuerUrl: issuerUrl.value, scopes: parsed, identifierClaim };
}

/**
 * Normalize userinfo/id_token claims into the shared profile shape.
 * @param claims - The claims returned by the IdP.
 * @param identifierClaim - The claim holding the account identifier. IdPs that
 * expose no `email` claim (Azure AD with a UPN, LDAP-backed Keycloak realms…)
 * can point this at `preferred_username` or `sub` instead.
 */
function normalizeOIDCClaims(claims: OIDCClaims, identifierClaim: SsoIdentifierClaim): NormalizedProfile {
  const identifier = claims[identifierClaim];

  if (!identifier) {
    throw new OAuthProfileError("email_missing");
  }

  const email = identifier.toLowerCase();
  const name = claims.name ?? [claims.given_name, claims.family_name].filter(Boolean).join(" ");

  return {
    providerAccountId: claims.sub,
    email,
    // `email_verified` only describes the `email` claim: when the identifier
    // comes from elsewhere, the IdP itself vouches for it. Enterprise IdPs
    // (Azure AD notably) often omit the claim entirely, so only an explicit
    // `false` marks the email as unverified.
    emailVerified: identifierClaim !== "email" || claims.email_verified !== false,
    ...splitName(name),
    avatarUrl: claims.picture ?? null,
  };
}

const PROVIDERS: Record<OAuth2ProviderId, OAuthProviderDef> = {
  google: {
    id: "google",
    usesPKCE: true,
    createAuthorizationURL: (clientId, clientSecret, state, codeVerifier) => {
      const client = new Google(clientId, clientSecret, redirectUri("google"));
      return client.createAuthorizationURL(state, codeVerifier ?? "", ["openid", "profile", "email"]);
    },
    validateCode: (clientId, clientSecret, code, codeVerifier) => {
      const client = new Google(clientId, clientSecret, redirectUri("google"));
      return client.validateAuthorizationCode(code, codeVerifier ?? "");
    },
    fetchProfile: async (tokens) => {
      const claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims;

      if (!claims.email) {
        throw new OAuthProfileError("email_missing");
      }

      return {
        providerAccountId: claims.sub,
        email: claims.email.toLowerCase(),
        emailVerified: claims.email_verified === true,
        ...splitName(claims.name ?? [claims.given_name, claims.family_name].filter(Boolean).join(" ")),
        avatarUrl: claims.picture ?? null,
      };
    },
  },
  github: {
    id: "github",
    usesPKCE: false,
    createAuthorizationURL: (clientId, clientSecret, state) => {
      const client = new GitHub(clientId, clientSecret, redirectUri("github"));
      return client.createAuthorizationURL(state, ["user:email"]);
    },
    validateCode: (clientId, clientSecret, code) => {
      const client = new GitHub(clientId, clientSecret, redirectUri("github"));
      return client.validateAuthorizationCode(code);
    },
    fetchProfile: async (tokens) => {
      const headers = GITHUB_API_HEADERS(tokens.accessToken());

      const userRes = await fetch("https://api.github.com/user", { headers });
      if (!userRes.ok) {
        throw new OAuthProfileError("oauth_failed");
      }
      const user = await userRes.json() as GitHubUser;

      // The `email` field of /user is null when the user keeps it private, so
      // the primary verified email must be fetched separately.
      const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
      if (!emailsRes.ok) {
        throw new OAuthProfileError("oauth_failed");
      }
      const emails = await emailsRes.json() as GitHubEmail[];
      const primary = emails.find(e => e.primary && e.verified) ?? emails.find(e => e.verified);

      if (!primary) {
        throw new OAuthProfileError("email_missing");
      }

      return {
        providerAccountId: String(user.id),
        email: primary.email.toLowerCase(),
        emailVerified: true,
        ...splitName(user.name),
        avatarUrl: user.avatar_url,
      };
    },
  },
  sso: {
    id: "sso",
    usesPKCE: true,
    createAuthorizationURL: async (clientId, clientSecret, state, codeVerifier) => {
      const { issuerUrl, scopes } = await getSsoSettings();
      const doc = await getDiscoveryDocument(issuerUrl);
      const client = new OAuth2Client(clientId, clientSecret, redirectUri("sso"));
      return client.createAuthorizationURLWithPKCE(doc.authorization_endpoint, state, CodeChallengeMethod.S256, codeVerifier ?? "", scopes);
    },
    validateCode: async (clientId, clientSecret, code, codeVerifier) => {
      const { issuerUrl } = await getSsoSettings();
      const doc = await getDiscoveryDocument(issuerUrl);
      const client = new OAuth2Client(clientId, clientSecret, redirectUri("sso"));
      return client.validateAuthorizationCode(doc.token_endpoint, code, codeVerifier ?? "");
    },
    fetchProfile: async (tokens) => {
      const { issuerUrl, identifierClaim } = await getSsoSettings();
      const doc = await getDiscoveryDocument(issuerUrl);

      if (doc.userinfo_endpoint) {
        const res = await fetch(doc.userinfo_endpoint, {
          headers: { Authorization: `Bearer ${tokens.accessToken()}` },
        });
        // A JWT-encoded userinfo response (signed_response_alg configured on
        // the IdP) is not parseable as JSON — fall back to the id_token.
        if (res.ok && !res.headers.get("content-type")?.includes("application/jwt")) {
          return normalizeOIDCClaims(await res.json() as OIDCClaims, identifierClaim);
        }
      }

      try {
        return normalizeOIDCClaims(decodeIdToken(tokens.idToken()) as OIDCClaims, identifierClaim);
      } catch (error) {
        if (error instanceof OAuthProfileError) {
          throw error;
        }
        throw new OAuthProfileError("oauth_failed");
      }
    },
  },
};

/** Raised when a provider profile cannot be normalized into a usable identity. */
export class OAuthProfileError extends Error {
  constructor(public code: "email_missing" | "oauth_failed") {
    super(`OAuth profile error: ${code}`);
  }
}

/**
 * Get a provider definition together with its configured credentials.
 * @param id - The provider id.
 * @returns The definition and credentials, or null when the provider is
 * disabled or not fully configured.
 */
export async function getConfiguredProvider(id: OAuth2ProviderId) {
  const [enable, clientId, clientSecret, issuerUrl] = await Promise.all([
    getConfig(`authentication.${id}.enable`),
    getConfig(`authentication.${id}.clientId`),
    getConfig(`authentication.${id}.clientSecret`),
    id === "sso" ? getConfig("authentication.sso.issuerUrl") : Promise.resolve(null),
  ]);

  if (enable?.value !== "true" || !clientId?.value || !clientSecret?.value) {
    return null;
  }

  if (id === "sso" && !issuerUrl?.value) {
    return null;
  }

  return {
    def: PROVIDERS[id],
    clientId: clientId.value,
    clientSecret: clientSecret.value,
  };
}

/**
 * List the providers that are enabled and fully configured.
 * @returns The provider ids usable for sign-in.
 */
export async function getEnabledProviders(): Promise<OAuth2ProviderId[]> {
  const results = await Promise.all(
    OAUTH2_PROVIDER_IDS.map(async id => ((await getConfiguredProvider(id)) ? id : null)),
  );

  return results.filter((id): id is OAuth2ProviderId => id !== null);
}

const PROVIDER_LABELS: Record<Exclude<OAuth2ProviderId, "sso">, string> = {
  google: "Google",
  github: "GitHub",
};

/**
 * Whether the SAML provider is enabled and carries the minimum an IdP needs:
 * where to send the request, who signed the answer, and who it claims to be.
 */
async function getConfiguredSaml(): Promise<{ label: string; autoLogin: boolean } | null> {
  const [enable, entryPoint, idpCert, idpIssuer, buttonLabel, autoLogin] = await Promise.all([
    getConfig("authentication.saml.enable"),
    getConfig("authentication.saml.entryPoint"),
    getConfig("authentication.saml.idpCert"),
    getConfig("authentication.saml.idpIssuer"),
    getConfig("authentication.saml.buttonLabel"),
    getConfig("authentication.saml.autoLogin"),
  ]);

  if (enable?.value !== "true" || !entryPoint?.value || !idpCert?.value || !idpIssuer?.value) {
    return null;
  }

  return {
    label: buttonLabel?.value || "SAML",
    autoLogin: autoLogin?.value === "true",
  };
}

/**
 * Build the public payload of the providers endpoint: enabled providers with
 * their display label, plus the auto-login flag.
 *
 * SAML is appended here rather than in `getEnabledProviders`, which only knows
 * about the OAuth 2.0 code flow.
 *
 * @returns The providers usable for sign-in and whether the login page should
 * redirect to an enterprise provider automatically.
 */
export async function getProvidersPayload() {
  const [enabled, saml] = await Promise.all([getEnabledProviders(), getConfiguredSaml()]);

  const providers: { id: OAuthProviderId; label: string }[] = await Promise.all(enabled.map(async (id) => {
    if (id === "sso") {
      const label = await getConfig("authentication.sso.buttonLabel");
      return { id, label: label?.value || "SSO" };
    }
    return { id, label: PROVIDER_LABELS[id] };
  }));

  if (saml) {
    providers.push({ id: "saml", label: saml.label });
  }

  // Only one provider can claim auto-login; SSO wins if both ask for it.
  let autoLogin = false;
  if (enabled.includes("sso")) {
    const config = await getConfig("authentication.sso.autoLogin");
    autoLogin = config?.value === "true";
  }
  if (!autoLogin && saml) {
    autoLogin = saml.autoLogin;
  }

  return { providers, autoLogin };
}
