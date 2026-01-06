import { z } from "zod";

import { validateEnv } from "@bunstack/shared/env";

export const env = validateEnv({
  // Dashboard URL where auth routes (/, /register, /verify) are hosted
  // This should be the same as the dashboard's public URL
  VITE_AUTH_URL: z.url(),
});
