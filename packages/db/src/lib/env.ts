import { z } from "zod";

import { validateEnv } from "~env";

export const env = validateEnv({
  DATABASE_URL: z.string(),
});
