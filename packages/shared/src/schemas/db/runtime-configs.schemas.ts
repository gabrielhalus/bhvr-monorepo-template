import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { RuntimeConfigModel } from "~shared/models/runtime-configs.model";

/**
 * Schema for runtime-configurations
 */
export const RuntimeConfigSchema = createSelectSchema(RuntimeConfigModel).extend({
  value: z.string().nullable(),
  type: z.enum(["string", "number", "boolean", "list"]),
  options: z.string().nullable(),
  disabledWhen: z.string().nullable(),
});
