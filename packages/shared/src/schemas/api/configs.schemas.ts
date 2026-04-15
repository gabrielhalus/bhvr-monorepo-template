import { z } from "zod";

/**
 * Schema for updating a config
 */
export const UpdateConfigSchema = z.object({
  value: z.string().nullable(),
});
