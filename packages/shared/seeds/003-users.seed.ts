import type { SeedMeta } from "~shared/seeds";

export const seed: SeedMeta = {
  id: "users",
  version: 1,
  description: "Default admin user",
  data: [
    {
      name: "Admin",
      email: "admin@example.org",
      password: "admin",
      roles: ["admin", "user"],
    },
  ],
};
