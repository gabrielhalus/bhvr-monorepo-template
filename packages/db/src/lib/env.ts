import { validateEnv } from "~env";
import { z } from "zod";

export const env = validateEnv({
  DATABASE_URL: z.string(),
});
