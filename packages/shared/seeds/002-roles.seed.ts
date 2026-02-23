import type { SeedMeta } from "~shared/seeds";

export const seed: SeedMeta = {
  id: "roles",
  version: 1,
  description: "Base system roles",
  data: [
    {
      name: "admin",
      index: 100,
      isDefault: false,
      isSuperAdmin: true,
    },
    {
      name: "user",
      index: 10,
      isDefault: true,
      isSuperAdmin: false,
    },
  ],
};
