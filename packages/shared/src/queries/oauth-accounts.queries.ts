import { and, count, eq } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OAuthAccountsModel } from "../models/oauth-accounts.model";
import { OAuthAccountSchema } from "../schemas/db/oauth-accounts.schemas";

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Get an OAuth account by its provider identity.
 * @param provider - The provider id (e.g. "google").
 * @param providerAccountId - The stable account id at the provider.
 * @returns The account record, or null if not linked.
 */
export async function getOAuthAccountByProvider(provider: string, providerAccountId: string) {
  const [row] = await drizzle
    .select()
    .from(OAuthAccountsModel)
    .where(and(
      eq(OAuthAccountsModel.provider, provider),
      eq(OAuthAccountsModel.providerAccountId, providerAccountId),
    ))
    .limit(1);

  if (!row) {
    return null;
  }

  return OAuthAccountSchema.parse(row);
}

/**
 * Get all OAuth accounts linked to a user.
 * @param userId - The user id.
 * @returns The linked account records.
 */
export async function getOAuthAccountsByUserId(userId: string) {
  const rows = await drizzle
    .select()
    .from(OAuthAccountsModel)
    .where(eq(OAuthAccountsModel.userId, userId));

  return rows.map(row => OAuthAccountSchema.parse(row));
}

/**
 * Link an OAuth provider identity to a user.
 * @param data - The link to create.
 * @param data.userId - The user id.
 * @param data.provider - The provider id.
 * @param data.providerAccountId - The stable account id at the provider.
 * @param data.email - The provider email at link time (display only).
 * @returns The created account record.
 */
export async function createOAuthAccount(data: { userId: string; provider: string; providerAccountId: string; email?: string | null }) {
  const [row] = await drizzle
    .insert(OAuthAccountsModel)
    .values(data)
    .returning();

  if (!row) {
    throw new Error("Failed to create OAuth account");
  }

  return OAuthAccountSchema.parse(row);
}

/**
 * Unlink an OAuth provider from a user.
 * @param userId - The user id.
 * @param provider - The provider id.
 * @returns The deleted account record, or null if it was not linked.
 */
export async function deleteOAuthAccount(userId: string, provider: string) {
  const [row] = await drizzle
    .delete(OAuthAccountsModel)
    .where(and(
      eq(OAuthAccountsModel.userId, userId),
      eq(OAuthAccountsModel.provider, provider),
    ))
    .returning();

  if (!row) {
    return null;
  }

  return OAuthAccountSchema.parse(row);
}

/**
 * Count the OAuth accounts linked to a user.
 * @param userId - The user id.
 * @returns The number of linked providers.
 */
export async function countOAuthAccountsByUserId(userId: string) {
  const [row] = await drizzle
    .select({ count: count() })
    .from(OAuthAccountsModel)
    .where(eq(OAuthAccountsModel.userId, userId));

  return row?.count ?? 0;
}
