import { z } from "zod";

/**
 * API key schema
 */
export const apiKeySchema = z
  .string()
  .refine(key => /^sk_(?:live|test)_[^.]+\..+$/.test(key), {
    message: "Invalid API key format",
  })
  .transform((key) => {
    const parts = key.split("_");

    const env = parts[1];
    const rest = parts.slice(2).join("_"); // jamais undefined ici

    const dotIndex = rest.indexOf(".");
    if (dotIndex === -1) {
      throw new Error("Invalid API key format");
    }

    const prefix = rest.slice(0, dotIndex);
    const secret = rest.slice(dotIndex + 1);

    return {
      env: env as "live" | "test",
      prefix,
      secret,
    };
  });
