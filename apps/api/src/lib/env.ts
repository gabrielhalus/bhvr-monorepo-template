import { z } from "zod";

import { validateEnv } from "~shared/env";
import { loadEnv } from "~shared/env/loader";

// Load env files from monorepo root in Vite-like cascade order
/* eslint-disable-next-line node/no-process-env */
loadEnv(process.env.NODE_ENV ?? "development", "../../");

export const env = validateEnv({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  HOSTNAME: z.string().regex(z.regexes.hostname).default("localhost"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  AUTH_URL: z.url(),
  SITE_URL: z.url(),
});
