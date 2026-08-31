import { z } from "zod";

export const OAUTH_PROVIDER_IDS = ["google", "github", "sso"] as const;

export const OAuthProviderIdSchema = z.enum(OAUTH_PROVIDER_IDS);

export const OAuthProviderParamSchema = z.object({
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
