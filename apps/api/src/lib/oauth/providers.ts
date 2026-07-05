import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { OAuth2Tokens } from "arctic";

import { CodeChallengeMethod, decodeIdToken, generateCodeVerifier, generateState, GitHub, Google, OAuth2Client } from "arctic";
import { ENV } from "varlock/env";

import { getConfig } from "~shared/queries/configs.queries";
import { OAUTH_PROVIDER_IDS } from "~shared/schemas/api/oauth.schemas";

import { getDiscoveryDocument } from "./oidc-discovery";

export { generateCodeVerifier, generateState };
export { OAuth2RequestError } from "arctic";

/** Profile shape shared by every provider after normalization. */
export type NormalizedProfile = {
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

type OAuthProviderDef = {
  id: OAuthProviderId;
  usesPKCE: boolean;
  createAuthorizationURL: (clientId: string, clientSecret: string, state: string, codeVerifier: string | null) => URL | Promise<URL>;
  validateCode: (clientId: string, clientSecret: string, code: string, codeVerifier: string | null) => Promise<OAuth2Tokens>;
  fetchProfile: (tokens: OAuth2Tokens) => Promise<NormalizedProfile>;
};

function redirectUri(provider: OAuthProviderId): string {
  return `${ENV.API_URL}/auth/oauth/${provider}/callback`;
}

/**
 * Split a display name into first/last, falling back to a login handle when
 * the provider exposes no usable name. Both parts are guaranteed non-empty —
 * the shared UserSchema rejects empty names.
 */
function splitName(name: string | null | undefined, fallback: string): { firstName: string; lastName: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = parts;

  return {
    firstName: first ?? fallback,
    lastName: rest.join(" ") || (first ?? fallback),
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

/** Read the admin-configured issuer and scopes of the generic SSO provider. */
async function getSsoSettings(): Promise<{ issuerUrl: string; scopes: string[] }> {
  const [issuerUrl, scopes] = await Promise.all([
    getConfig("authentication.sso.issuerUrl"),
    getConfig("authentication.sso.scopes"),
  ]);

  if (!issuerUrl?.value) {
    throw new Error("SSO issuer URL is not configured");
  }

  const parsed = (scopes?.value ?? "").split(/\s+/).filter(Boolean);
  if (!parsed.includes("openid")) {
    parsed.unshift("openid");
  }

  return { issuerUrl: issuerUrl.value, scopes: parsed };
}

/** Normalize userinfo/id_token claims into the shared profile shape. */
function normalizeOIDCClaims(claims: OIDCClaims): NormalizedProfile {
  if (!claims.email) {
    throw new OAuthProfileError("email_missing");
  }

  const email = claims.email.toLowerCase();
  const name = claims.name ?? [claims.given_name, claims.family_name].filter(Boolean).join(" ");

  return {
    providerAccountId: claims.sub,
    email,
    // Enterprise IdPs (Azure AD notably) often omit the claim entirely; the
    // IdP is the source of truth, so only an explicit `false` marks the email
    // as unverified.
    emailVerified: claims.email_verified !== false,
    ...splitName(name, claims.preferred_username ?? email.split("@")[0] ?? "user"),
    avatarUrl: claims.picture ?? null,
  };
}

const PROVIDERS: Record<OAuthProviderId, OAuthProviderDef> = {
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
        ...splitName(claims.name ?? [claims.given_name, claims.family_name].filter(Boolean).join(" "), claims.email.split("@")[0] ?? "user"),
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
        ...splitName(user.name, user.login),
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
      const { issuerUrl } = await getSsoSettings();
      const doc = await getDiscoveryDocument(issuerUrl);

      if (doc.userinfo_endpoint) {
        const res = await fetch(doc.userinfo_endpoint, {
          headers: { Authorization: `Bearer ${tokens.accessToken()}` },
        });
        // A JWT-encoded userinfo response (signed_response_alg configured on
        // the IdP) is not parseable as JSON — fall back to the id_token.
        if (res.ok && !res.headers.get("content-type")?.includes("application/jwt")) {
          return normalizeOIDCClaims(await res.json() as OIDCClaims);
        }
      }

      try {
        return normalizeOIDCClaims(decodeIdToken(tokens.idToken()) as OIDCClaims);
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
export async function getConfiguredProvider(id: OAuthProviderId) {
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
export async function getEnabledProviders(): Promise<OAuthProviderId[]> {
  const results = await Promise.all(
    OAUTH_PROVIDER_IDS.map(async id => ((await getConfiguredProvider(id)) ? id : null)),
  );

  return results.filter((id): id is OAuthProviderId => id !== null);
}

const PROVIDER_LABELS: Record<Exclude<OAuthProviderId, "sso">, string> = {
  google: "Google",
  github: "GitHub",
};

/**
 * Build the public payload of the providers endpoint: enabled providers with
 * their display label, plus the SSO auto-login flag.
 * @returns The providers usable for sign-in and whether the login page should
 * redirect to the SSO provider automatically.
 */
export async function getProvidersPayload() {
  const enabled = await getEnabledProviders();

  const providers = await Promise.all(enabled.map(async (id) => {
    if (id === "sso") {
      const label = await getConfig("authentication.sso.buttonLabel");
      return { id, label: label?.value || "SSO" };
    }
    return { id, label: PROVIDER_LABELS[id] };
  }));

  let autoLogin = false;
  if (enabled.includes("sso")) {
    const config = await getConfig("authentication.sso.autoLogin");
    autoLogin = config?.value === "true";
  }

  return { providers, autoLogin };
}
