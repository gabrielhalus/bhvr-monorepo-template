import type { SeedMeta } from "~shared/seeds";

import { seed as runtimeConfigsSeed } from "./001-runtime-configs.seed";
import { seed as rolesSeed } from "./002-roles.seed";
import { seed as usersSeed } from "./003-users.seed";

// Seeds are ordered by their filename prefix
export const seeds: SeedMeta[] = [
  rolesSeed,
  runtimeConfigsSeed,
  usersSeed,
];
