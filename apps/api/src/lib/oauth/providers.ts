import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";
import type { OAuth2Tokens } from "arctic";

import { decodeIdToken, generateCodeVerifier, generateState, GitHub, Google } from "arctic";
import { ENV } from "varlock/env";

import { getConfig } from "~shared/queries/configs.queries";
import { OAUTH_PROVIDER_IDS } from "~shared/schemas/api/oauth.schemas";

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
  createAuthorizationURL: (clientId: string, clientSecret: string, state: string, codeVerifier: string | null) => URL;
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
  const [enable, clientId, clientSecret] = await Promise.all([
    getConfig(`authentication.${id}.enable`),
    getConfig(`authentication.${id}.clientId`),
    getConfig(`authentication.${id}.clientSecret`),
  ]);

  if (enable?.value !== "true" || !clientId?.value || !clientSecret?.value) {
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
