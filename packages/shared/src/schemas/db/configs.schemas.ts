import { z } from "zod";

export const ConfigSchema = z.object({
  configKey: z.string(),
  value: z.string().nullable(),
  defaultValue: z.string().nullable(),
  isOverridden: z.boolean(),
  type: z.enum(["string", "number", "boolean", "list", "node"]),
  nullable: z.boolean(),
  multiline: z.boolean(),
  secret: z.boolean(),
  rotatable: z.boolean(),
  options: z.string().nullable(),
  disabledWhen: z.string().nullable(),
  order: z.number(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
});
