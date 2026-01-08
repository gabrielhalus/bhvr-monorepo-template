import { z } from "zod";

/**
 * Schema for updating a runtime-config
 */
export const UpdateRuntimeConfigSchema = z.object({
  value: z.any(),
});
