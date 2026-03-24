import type { SeedMeta } from "~shared/seeds";

import { ENV } from "varlock/env";

export const seed: SeedMeta = {
  id: "users",
  version: 1,
  description: "Bootstrap system administrator user",
  data: [
    {
      firstName: "System",
      lastName: "Administrator",
      email: `admin@${ENV.APP_HOST}`,
      roles: ["admin"],
      metadata: {
        system: true,
      },
    },
  ],
};
