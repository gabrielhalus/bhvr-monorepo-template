import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { inferConfigValue } from "@bunstack/shared/helpers";
import { RuntimeConfigModel } from "@bunstack/shared/models/runtime-config.model";

/**
 * Schema for runtime-configurations
 */
export const RuntimeConfigSchema = createSelectSchema(RuntimeConfigModel).extend({
  value: z.string().transform(inferConfigValue),
});
