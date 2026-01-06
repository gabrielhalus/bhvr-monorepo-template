import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { inferConfigValue } from "~shared/helpers";
import { RuntimeConfigModel } from "~shared/db/models/runtime-configs.model";

/**
 * Schema for runtime-configurations
 */
export const RuntimeConfigSchema = createSelectSchema(RuntimeConfigModel).extend({
  value: z.string().transform(inferConfigValue),
});
