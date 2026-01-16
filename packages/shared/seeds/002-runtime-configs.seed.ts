import type { SeedMeta } from "~shared/seeds";

export const seed: SeedMeta = {
  id: "runtime-configs",
  version: 1,
  description: "Default runtime configuration values",
  data: [
    {
      configKey: "authentication.00_disableRegister",
      value: "true",
      type: "boolean",
      nullable: false,
    },
  ],
};
