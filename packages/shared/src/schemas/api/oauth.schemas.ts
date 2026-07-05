import { z } from "zod";

export const OAUTH_PROVIDER_IDS = ["google", "github"] as const;

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

/** Provider profile snapshot stored in oauth_link_tokens.profile. */
export const OAuthProfileSchema = z.object({
  email: z.string(),
  emailVerified: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
});
