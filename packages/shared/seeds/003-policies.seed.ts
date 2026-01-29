import type { SeedMeta } from "~shared/seeds";

export const seed: SeedMeta = {
  id: "policies",
  version: 1,
  description: "Default admin user",
  data: [
    {
      effect: "allow",
      permission: "user:update",
      roleId: 2,
      condition: JSON.stringify({
        op: "eq",
        left: { type: "user_attr", key: "id" },
        right: { type: "resource_attr", key: "id" },
      }),
    },
  ],
};
