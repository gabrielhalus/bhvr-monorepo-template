import type { SeedMeta } from "~shared/seeds";

import { seed as rolesSeed } from "./001-roles.seed";
import { seed as runtimeConfigsSeed } from "./002-runtime-configs.seed";

// Seeds are ordered by their filename prefix
export const seeds: SeedMeta[] = [
  rolesSeed,
  runtimeConfigsSeed,
];
