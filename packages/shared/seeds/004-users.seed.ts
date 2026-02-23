import type { SeedMeta } from "~shared/seeds";

import { z } from "zod";

import { validateEnv } from "~shared/env";

const env = validateEnv({
  HOSTNAME: z.string(),
});

export const seed: SeedMeta = {
  id: "users",
  version: 1,
  description: "Bootstrap system administrator user",
  data: [
    {
      firstName: "System",
      lastName: "Administrator",
      email: `admin@${env.HOSTNAME}`,
      roles: ["admin"],
      metadata: {
        system: true,
      },
    },
  ],
};
