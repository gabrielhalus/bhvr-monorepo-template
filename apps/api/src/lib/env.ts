import { config } from "dotenv";
import { z } from "zod";

import { validateEnv } from "~shared/env";

config({ path: "../../.env" });

export const env = validateEnv({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  HOSTNAME: z.string().regex(z.regexes.hostname).default("localhost"),
  JWT_SECRET: z.string(),
  AUTH_URL: z.url(),
  SITE_URL: z.url(),
});
