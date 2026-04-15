import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { ConfigModel } from "~shared/models/configs.model";

/**
 * Schema for configurations
 */
export const ConfigSchema = createSelectSchema(ConfigModel).extend({
  value: z.string().nullable(),
  type: z.enum(["string", "number", "boolean", "list", "node"]),
  options: z.string().nullable(),
  disabledWhen: z.string().nullable(),
});
