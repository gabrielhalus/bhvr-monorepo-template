import type { InsertTokenSchema, UpdateTokenSchema } from "@bunstack/shared/schemas/db/tokens.schemas";
import type { Token } from "@bunstack/shared/types/tokens.types";
import type { z } from "zod";

import { eq } from "drizzle-orm";

import { drizzle } from "@/database";
import { TokensModel } from "@bunstack/shared/models/tokens.model";

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
