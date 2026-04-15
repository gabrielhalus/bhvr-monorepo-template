import type { InsertApiKeySchema } from "../schemas/db/api-keys.schemas";
import type { ApiKey } from "../types/db/api-keys.types";
import type { z } from "zod";

import { eq } from "drizzle-orm";

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
  const [ak] = await drizzle
    .select()
    .from(ApiKeysModel)
    .where(eq(ApiKeysModel.id, id))
    .limit(1);

  if (!ak) {
    return null;
  }

  return ak;
}

/**
 * Insert a new API key.
 * @param ak - The API key to insert.
 * @returns The inserted API key.
 * @throws An error if the API key could not be inserted.
 */
export async function insertApiKey(ak: z.infer<typeof InsertApiKeySchema>): Promise<ApiKey> {
  const [insertedApiKey] = await drizzle
    .insert(ApiKeysModel)
    .values(ak)
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
