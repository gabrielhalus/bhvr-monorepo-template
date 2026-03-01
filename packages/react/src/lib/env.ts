import { z } from "zod";

import { validateEnv } from "~shared/env";

export const env = validateEnv({
  VITE_API_URL: z.string(),
  VITE_SITE_URL: z.string(),
  VITE_AUTH_URL: z.string(),
});
