import { runSeeds } from "~shared/seeds";

import { seeds } from "../seeds/index";

await runSeeds(seeds);
process.exit(0);
