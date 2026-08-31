import type { OAuthProfileSchema } from "../schemas/api/oauth.schemas";
import type { z } from "zod";

import { and, eq, gt, isNull } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OAuthSignupTokensModel } from "../models/oauth-signup-tokens.model";
import { OAuthSignupTokenSchema } from "../schemas/db/oauth-signup-tokens.schemas";

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Create a pending-signup token after an OAuth login reached an unknown email
 * whose profile is missing fields the account requires.
 *
 * Any outstanding token for the same provider identity is deleted first, so
 * restarting the flow invalidates the previous attempt.
 *
 * @param data - The pending signup to create.
 * @param data.provider - The provider id.
 * @param data.providerAccountId - The stable account id at the provider.
 * @param data.token - The opaque token string handed to the flow initiator.
 * @param data.profile - The normalized provider profile snapshot.
 * @param data.expiresAt - When the token expires.
 * @returns The created token record.
 */
export async function createOAuthSignupToken(data: {
  provider: string;
  providerAccountId: string;
  token: string;
  profile: z.infer<typeof OAuthProfileSchema>;
  expiresAt: Date;
}) {
  await drizzle.delete(OAuthSignupTokensModel).where(and(
    eq(OAuthSignupTokensModel.provider, data.provider),
    eq(OAuthSignupTokensModel.providerAccountId, data.providerAccountId),
  ));

  const [row] = await drizzle
    .insert(OAuthSignupTokensModel)
    .values({ ...data, expiresAt: data.expiresAt.toISOString() })
    .returning();

  if (!row) {
    throw new Error("Failed to create OAuth signup token");
  }

  return OAuthSignupTokenSchema.parse(row);
}

/**
 * Get a pending-signup token that is still valid (not used and not expired).
 * @param token - The token string.
 * @returns The token record, or null if missing, used, or expired.
 */
export async function getValidOAuthSignupToken(token: string) {
  const [row] = await drizzle
    .select()
    .from(OAuthSignupTokensModel)
    .where(and(
      eq(OAuthSignupTokensModel.token, token),
      isNull(OAuthSignupTokensModel.usedAt),
      gt(OAuthSignupTokensModel.expiresAt, new Date().toISOString()),
    ))
    .limit(1);

  if (!row) {
    return null;
  }

  return OAuthSignupTokenSchema.parse(row);
}

/**
 * Mark a pending-signup token as used so it cannot be replayed.
 * @param id - The token record id.
 */
export async function markOAuthSignupTokenUsed(id: string) {
  await drizzle
    .update(OAuthSignupTokensModel)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(OAuthSignupTokensModel.id, id));
}
