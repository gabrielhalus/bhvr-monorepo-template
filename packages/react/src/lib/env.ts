import { z } from "zod";

import { validateEnv } from "~shared/env";

export const env = validateEnv({
  // VITE_API_URL can be relative path (/api) in development, or full URL in production
  VITE_API_URL: z.string().min(1, "VITE_API_URL is required"),
  VITE_SITE_URL: z.url(),
  VITE_AUTH_URL: z.url(),
});
