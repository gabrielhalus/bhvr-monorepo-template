import { z } from "zod";

/**
 * Ensures query param is always an array
 * @param schema - The Zod schema to validate each array element
 * @returns A Zod schema that always returns an optional array
 */
export function arrayParam<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (val) => {
      if (Array.isArray(val))
        return val;
      if (val !== undefined && val !== null)
        return [val];
      return undefined;
    },
    z.array(schema).optional(),
  );
}
