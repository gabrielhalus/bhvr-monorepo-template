/* eslint-disable node/no-process-env */
import type { z, ZodRawShape } from "zod";

import { z as zod } from "zod";

type EnvSource = Record<string, string | undefined>;

/**
 * Detects the environment source:
 * - `process.env` for Node/Bun/Next.js server
 * - `import.meta.env` for Vite/React frontend
 */
function getEnvSource(): EnvSource {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  };

  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env as Record<string, string | undefined>;
  }

  throw new Error("No environment variables found. Are you in an unsupported environment?");
}

/**
 * Validates environment variables against a Zod schema.
 */
export function validateEnv<T extends ZodRawShape>(schema: T): z.infer<z.ZodObject<T>> {
  const envSource = getEnvSource();

  const envObject = Object.fromEntries(
    Object.keys(schema).map(key => [key, envSource[key]]),
  );

  const zodSchema = zod.object(schema);
  const result = zodSchema.safeParse(envObject);

  if (!result.success) {
    const errors = zod.treeifyError(result.error);
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(errors, null, 2)}`,
    );
  }

  return result.data;
}
