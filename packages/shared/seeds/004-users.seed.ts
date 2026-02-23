import type { SeedMeta } from "~shared/seeds";

export const seed: SeedMeta = {
  id: "users",
  version: 1,
  description: "Default admin user",
  data: [
    {
      firstName: "Admin",
      lastName: "Admin",
      email: "admin@example.org",
      password: "admin",
      roles: ["admin", "user"],
    },
  ],
};
