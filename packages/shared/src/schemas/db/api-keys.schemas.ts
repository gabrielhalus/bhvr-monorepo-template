import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { ApiKeysModel } from "~shared/models/api-keys.model";

/**
 * API key schema
 */
export const ApiKeySchema = createSelectSchema(ApiKeysModel);

/**
 * Insert API key schema
 */
export const InsertApiKeySchema = createInsertSchema(ApiKeysModel);
