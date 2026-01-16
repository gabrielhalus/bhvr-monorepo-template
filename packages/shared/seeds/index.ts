import type { SeedMeta } from "~shared/seeds";

import { seed as rolesSeed } from "./001-roles.seed";
import { seed as runtimeConfigsSeed } from "./002-runtime-configs.seed";
import { seed as usersSeed } from "./003-users.seed";

// Seeds are ordered by their filename prefix
export const seeds: SeedMeta[] = [
  rolesSeed,
  runtimeConfigsSeed,
  usersSeed,
];
