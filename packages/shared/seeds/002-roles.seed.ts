import type { SeedMeta } from "~shared/seeds";

export const seed: SeedMeta = {
  id: "roles",
  version: 1,
  description: "Base system roles",
  data: [
    {
      name: "admin",
      label: "Admin",
      description: "Administrator with full access",
      index: 100,
      isDefault: false,
      isSuperAdmin: true,
    },
    {
      name: "user",
      label: "User",
      description: "Standard user role",
      index: 10,
      isDefault: true,
      isSuperAdmin: false,
    },
  ],
};
