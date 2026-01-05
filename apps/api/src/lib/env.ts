import { z } from "zod";
import "dotenv/config"; // loads default .env in current folder

import { validateEnv } from "~env";

export const env = validateEnv({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  HOSTNAME: z.string().regex(z.regexes.hostname).default("localhost"),
  // Dashboard URL where auth routes (/, /register, /verify) are hosted
  AUTH_URL: z.url(),
  SITE_URL: z.url(),
  JWT_SECRET: z.string(),
  NO_REPLY_EMAIL: z.email(),
  SUPPORT_EMAIL: z.email(),
  RESEND_API_KEY: z.string(),
});
