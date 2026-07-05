import { and, eq, gt, isNull } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { PasswordResetTokensModel } from "../models/password-reset-tokens.model";
import { PasswordResetTokenSchema } from "../schemas/db/password-reset-tokens.schemas";

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Create a password reset token for a user.
 *
 * Any outstanding tokens for the same user are deleted first so a fresh request
 * invalidates previous links.
 *
 * @param userId - The user the token belongs to.
 * @param token - The opaque token string embedded in the reset link.
 * @param expiresAt - When the token expires.
 * @returns The created token record.
 */
export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
  await drizzle.delete(PasswordResetTokensModel).where(eq(PasswordResetTokensModel.userId, userId));

  const [row] = await drizzle
    .insert(PasswordResetTokensModel)
    .values({ userId, token, expiresAt: expiresAt.toISOString() })
    .returning();

  if (!row) {
    throw new Error("Failed to create password reset token");
  }

  return PasswordResetTokenSchema.parse(row);
}

/**
 * Get a password reset token that is still valid (not used and not expired).
 * @param token - The token string.
 * @returns The token record, or null if missing, used, or expired.
 */
export async function getValidPasswordResetToken(token: string) {
  const [row] = await drizzle
    .select()
    .from(PasswordResetTokensModel)
    .where(and(
      eq(PasswordResetTokensModel.token, token),
      isNull(PasswordResetTokensModel.usedAt),
      gt(PasswordResetTokensModel.expiresAt, new Date().toISOString()),
    ))
    .limit(1);

  if (!row) {
    return null;
  }

  return PasswordResetTokenSchema.parse(row);
}

/**
 * Mark a password reset token as used so it cannot be replayed.
 * @param id - The token record id.
 */
export async function markPasswordResetTokenUsed(id: string) {
  await drizzle
    .update(PasswordResetTokensModel)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(PasswordResetTokensModel.id, id));
}
