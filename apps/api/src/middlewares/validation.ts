import type { ValidationTargets } from "hono";
import type z from "zod";

import { zValidator } from "@hono/zod-validator";

/**
 * The validation middleware.
 * @param target - The target to validate.
 * @param schema - The schema to validate against.
 * @returns The validation middleware.
 */
export function validationMiddleware<T extends z.ZodSchema, U extends keyof ValidationTargets>(target: U, schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false as const,
        error: {
          message: result.error.issues[0]?.message,
          innerError: {
            timestamp: new Date(Date.now()),
          },
        },
      }, 400);
    }
  });
}
