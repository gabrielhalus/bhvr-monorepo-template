import { z } from "zod";

/**
 * Every identity provider that can back an account in `oauth_accounts`.
 *
 * SAML sits in this list despite not being an OAuth protocol: an account linked
 * to an IdP is the same domain object whichever protocol vouched for it, and
 * reusing the table keeps linking, unlinking and the uniqueness constraints in
 * one place.
 */
export const OAUTH_PROVIDER_IDS = ["google", "github", "sso", "saml"] as const;

/**
 * The subset reachable through the OAuth 2.0 authorization-code routes.
 *
 * SAML is excluded: it has no code exchange and lives under `/auth/saml`.
 */
export const OAUTH2_PROVIDER_IDS = ["google", "github", "sso"] as const;

export const OAuthProviderIdSchema = z.enum(OAUTH_PROVIDER_IDS);

export const OAuth2ProviderIdSchema = z.enum(OAUTH2_PROVIDER_IDS);

/** Param schema for the OAuth 2.0 routes, which SAML must not reach. */
export const OAuthProviderParamSchema = z.object({
  provider: OAuth2ProviderIdSchema,
});

/** Param schema for routes that accept any linked provider (unlinking…). */
export const AnyProviderParamSchema = z.object({
  provider: OAuthProviderIdSchema,
});

export const OAuthStartQuerySchema = z.object({
  redirect: z.string().optional(),
  linkToken: z.string().optional(),
});

export const OAuthCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const PendingLinkQuerySchema = z.object({
  token: z.string().min(1, "requiredErrorMessage"),
});

export const CompletePendingLinkSchema = z.object({
  token: z.string().min(1, "requiredErrorMessage"),
  password: z.string().min(1, "requiredErrorMessage"),
});

/**
 * Provider profile snapshot stored in oauth_link_tokens.profile and
 * oauth_signup_tokens.profile.
 *
 * Names are nullable: an identity provider is free to expose no usable name,
 * and the signup flow asks the visitor rather than inventing one.
 */
export const OAuthProfileSchema = z.object({
  email: z.string(),
  emailVerified: z.boolean(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const PendingSignupQuerySchema = z.object({
  token: z.string().min(1, "requiredErrorMessage"),
});

/**
 * Completion payload for an OAuth signup. Only the fields the provider may
 * omit — the email comes from the provider and no password is ever set.
 */
export const CompletePendingSignupSchema = z.object({
  token: z.string().min(1, "requiredErrorMessage"),
  firstName: z.string().min(1, "requiredErrorMessage").max(50, "maxLengthErrorMessage"),
  lastName: z.string().min(1, "requiredErrorMessage").max(50, "maxLengthErrorMessage"),
});
