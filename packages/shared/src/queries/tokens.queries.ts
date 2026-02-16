import type { InsertTokenSchema, UpdateTokenSchema } from "../schemas/db/tokens.schemas";
import type { Token } from "../types/db/tokens.types";
import type { z } from "zod";

import { and, eq, gt, isNull, ne } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { TokensModel } from "../models/tokens.model";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all tokens.
 * @returns All tokens.
 */
export async function getTokens(): Promise<Token[]> {
  return drizzle
    .select()
    .from(TokensModel);
}

/**
 * Get a token by its id.
 * @param id - The id of the token.
 * @returns The token.
 */
export async function getToken(id: string): Promise<Token | null> {
  const [token] = await drizzle
    .select()
    .from(TokensModel)
    .where(eq(TokensModel.id, id))
    .limit(1);

  if (!token) {
    return null;
  }

  return token;
}

/**
 * Insert a new token.
 * @param token - The token to insert.
 * @returns The inserted token.
 * @throws An error if the token could not be inserted.
 */
export async function insertToken(token: z.infer<typeof InsertTokenSchema>): Promise<Token> {
  const [insertedToken] = await drizzle
    .insert(TokensModel)
    .values(token)
    .returning();

  if (!insertedToken) {
    throw new Error("Failed to insert token");
  }

  return insertedToken;
}

/**
 * Update a token.
 * @param id - The token id.
 * @param token - The token to update.
 * @returns The updated token.
 * @throws An error if the token could not be updated.
 */
export async function updateToken(id: string, token: z.infer<typeof UpdateTokenSchema>): Promise<Token> {
  const [updatedToken] = await drizzle
    .update(TokensModel)
    .set(token)
    .where(eq(TokensModel.id, id))
    .returning();

  if (!updatedToken) {
    throw new Error("Failed to update token");
  }

  return updatedToken;
}

/**
 * Delete a token.
 * @param id - The id of the token.
 * @returns The deleted token.
 * @throws An error if the token could not be deleted.
 */
export async function deleteToken(id: string): Promise<Token> {
  const [deletedToken] = await drizzle.delete(TokensModel).where(eq(TokensModel.id, id)).returning();

  if (!deletedToken) {
    throw new Error("Failed to delete token");
  }

  return deletedToken;
}

/**
 * Delete all tokens.
 * @returns The deleted tokens.
 * @throws An error if the tokens could not be deleted.
 */
export async function deleteAllTokens(): Promise<Token[]> {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  const deletedTokens = await drizzle
    .delete(TokensModel)
    .returning();

  if (!deletedTokens) {
    throw new Error("Failed to delete all tokens");
  }

  return deletedTokens;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get all active (non-revoked, non-expired) tokens for a user.
 * @param userId - The user ID.
 * @returns The active tokens.
 */
export async function getActiveTokensByUserId(userId: string): Promise<Token[]> {
  return drizzle
    .select()
    .from(TokensModel)
    .where(
      and(
        eq(TokensModel.userId, userId),
        isNull(TokensModel.revokedAt),
        gt(TokensModel.expiresAt, new Date().toISOString()),
      ),
    )
    .orderBy(TokensModel.issuedAt);
}

/**
 * Soft-revoke a token by setting its revokedAt timestamp.
 * @param id - The token ID.
 * @returns The revoked token.
 * @throws An error if the token could not be revoked.
 */
export async function revokeToken(id: string): Promise<Token> {
  const [revokedToken] = await drizzle
    .update(TokensModel)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(TokensModel.id, id))
    .returning();

  if (!revokedToken) {
    throw new Error("Failed to revoke token");
  }

  return revokedToken;
}

/**
 * Hard-delete all tokens for a user.
 * @param userId - The user ID.
 * @returns The deleted tokens.
 */
export async function revokeAllTokensByUserId(userId: string): Promise<Token[]> {
  return drizzle
    .delete(TokensModel)
    .where(eq(TokensModel.userId, userId))
    .returning();
}

/**
 * Hard-delete all tokens for a user except one (e.g. current session).
 * @param userId - The user ID.
 * @param exceptTokenId - The token ID to keep.
 * @returns The deleted tokens.
 */
export async function revokeAllTokensByUserIdExcept(userId: string, exceptTokenId: string): Promise<Token[]> {
  return drizzle
    .delete(TokensModel)
    .where(
      and(
        eq(TokensModel.userId, userId),
        ne(TokensModel.id, exceptTokenId),
      ),
    )
    .returning();
}
