import { z } from "zod";

import { validateEnv } from "~shared/env";

export const env = validateEnv({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  HOSTNAME: z.string().regex(z.regexes.hostname).default("localhost"),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  AUTH_URL: z.url(),
  SITE_URL: z.url(),
});
