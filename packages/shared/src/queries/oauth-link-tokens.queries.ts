import type { OAuthProfileSchema } from "../schemas/api/oauth.schemas";
import type { z } from "zod";

import { and, eq, gt, isNull } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OAuthLinkTokensModel } from "../models/oauth-link-tokens.model";
import { OAuthLinkTokenSchema } from "../schemas/db/oauth-link-tokens.schemas";

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Create a pending-link token after an OAuth login matched an existing account.
 *
 * Any outstanding tokens for the same user are deleted first so a fresh OAuth
 * attempt invalidates previous pending links.
 *
 * @param data - The pending link to create.
 * @param data.userId - The existing account the link targets.
 * @param data.provider - The provider id.
 * @param data.providerAccountId - The stable account id at the provider.
 * @param data.token - The opaque token string handed to the flow initiator.
 * @param data.profile - The normalized provider profile snapshot.
 * @param data.expiresAt - When the token expires.
 * @returns The created token record.
 */
export async function createOAuthLinkToken(data: {
  userId: string;
  provider: string;
  providerAccountId: string;
  token: string;
  profile: z.infer<typeof OAuthProfileSchema>;
  expiresAt: Date;
}) {
  await drizzle.delete(OAuthLinkTokensModel).where(eq(OAuthLinkTokensModel.userId, data.userId));

  const [row] = await drizzle
    .insert(OAuthLinkTokensModel)
    .values({ ...data, expiresAt: data.expiresAt.toISOString() })
    .returning();

  if (!row) {
    throw new Error("Failed to create OAuth link token");
  }

  return OAuthLinkTokenSchema.parse(row);
}

/**
 * Get a pending-link token that is still valid (not used and not expired).
 * @param token - The token string.
 * @returns The token record, or null if missing, used, or expired.
 */
export async function getValidOAuthLinkToken(token: string) {
  const [row] = await drizzle
    .select()
    .from(OAuthLinkTokensModel)
    .where(and(
      eq(OAuthLinkTokensModel.token, token),
      isNull(OAuthLinkTokensModel.usedAt),
      gt(OAuthLinkTokensModel.expiresAt, new Date().toISOString()),
    ))
    .limit(1);

  if (!row) {
    return null;
  }

  return OAuthLinkTokenSchema.parse(row);
}

/**
 * Mark a pending-link token as used so it cannot be replayed.
 * @param id - The token record id.
 */
export async function markOAuthLinkTokenUsed(id: string) {
  await drizzle
    .update(OAuthLinkTokensModel)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(OAuthLinkTokensModel.id, id));
}
