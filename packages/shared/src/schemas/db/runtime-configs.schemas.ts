import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { RuntimeConfigModel } from "~shared/db/models/runtime-configs.model";
import { inferConfigValue } from "~shared/helpers";

/**
 * Schema for runtime-configurations
 */
export const RuntimeConfigSchema = createSelectSchema(RuntimeConfigModel).extend({
  value: z.string().transform(inferConfigValue),
});
