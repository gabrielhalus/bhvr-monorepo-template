import type { ApiKeysModel } from "~shared/models/api-keys.model";

export type ApiKey = typeof ApiKeysModel.$inferSelect;
