import type { InsertApiKeySchema } from "../schemas/db/api-keys.schemas";
import type { ApiKey } from "../types/db/api-keys.types";
import type { z } from "zod";

import { and, eq, isNull } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { ApiKeysModel } from "../models/api-keys.model";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all API key.
 * @returns All API key.
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  return drizzle
    .select()
    .from(ApiKeysModel);
}

/**
 * Get a API key by its id.
 * @param id - The id of the API key.
 * @returns The API key.
 */
export async function getApiKey(id: string): Promise<ApiKey | null> {
  const [apiKey] = await drizzle
    .select()
    .from(ApiKeysModel)
    .where(eq(ApiKeysModel.id, id))
    .limit(1);

  if (!apiKey) {
    return null;
  }

  return apiKey;
}

/**
 * Insert a new API key.
 * @param apiKey - The API key to insert.
 * @returns The inserted API key.
 * @throws An error if the API key could not be inserted.
 */
export async function insertApiKey(apiKey: z.infer<typeof InsertApiKeySchema>): Promise<ApiKey> {
  const [insertedApiKey] = await drizzle
    .insert(ApiKeysModel)
    .values(apiKey)
    .returning();

  if (!insertedApiKey) {
    throw new Error("Failed to insert API key");
  }

  return insertedApiKey;
}

/**
 * Delete a API key.
 * @param id - The id of the API key.
 * @returns The deleted API key.
 * @throws An error if the API key could not be deleted.
 */
export async function deleteApiKey(id: string): Promise<ApiKey> {
  const [deletedApiKey] = await drizzle.delete(ApiKeysModel).where(eq(ApiKeysModel.id, id)).returning();

  if (!deletedApiKey) {
    throw new Error("Failed to delete API key");
  }

  return deletedApiKey;
}

/**
 * Delete all API key.
 * @returns The deleted API key.
 * @throws An error if the API key could not be deleted.
 */
export async function deleteAllApiKeys(): Promise<ApiKey[]> {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  const deletedApiKeys = await drizzle
    .delete(ApiKeysModel)
    .returning();

  if (!deletedApiKeys) {
    throw new Error("Failed to delete all API keys");
  }

  return deletedApiKeys;
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get all active (non-revoked) API keys for a user.
 * @param userId - The user ID.
 * @returns The active API keys.
 */
export async function getActiveApiKeysByUserId(userId: string): Promise<ApiKey[]> {
  return drizzle
    .select()
    .from(ApiKeysModel)
    .where(
      and(
        eq(ApiKeysModel.userId, userId),
        isNull(ApiKeysModel.revokedAt),
      ),
    )
    .orderBy(ApiKeysModel.createdAt);
}

/**
 * Get a API key by its prefix.
 * @param prefix - The prefix of the API key.
 * @returns The API key.
 */
export async function getApiKeyByPrefix(prefix: string): Promise<ApiKey | null> {
  const [apiKey] = await drizzle
    .select()
    .from(ApiKeysModel)
    .where(eq(ApiKeysModel.prefix, prefix))
    .limit(1);

  if (!apiKey) {
    return null;
  }

  return apiKey;
}

/**
 * Soft-revoke a API key by setting its revokedAt timestamp.
 * @param id - The API key ID.
 * @returns The revoked API key.
 * @throws An error if the API key could not be revoked.
 */
export async function revokeApiKey(id: string): Promise<ApiKey> {
  const [revokedApiKey] = await drizzle
    .update(ApiKeysModel)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(ApiKeysModel.id, id))
    .returning();

  if (!revokedApiKey) {
    throw new Error("Failed to revoke token");
  }

  return revokedApiKey;
}
