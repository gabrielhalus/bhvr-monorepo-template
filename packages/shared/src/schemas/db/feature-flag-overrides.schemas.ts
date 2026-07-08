import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { FeatureFlagOverridesModel } from "~shared/models/feature-flag-overrides.model";

export const FeatureFlagOverrideSchema = createSelectSchema(FeatureFlagOverridesModel);

export const InsertFeatureFlagOverrideSchema = createInsertSchema(FeatureFlagOverridesModel).omit({ updatedAt: true });
