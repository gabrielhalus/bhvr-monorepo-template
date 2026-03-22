import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const { seeds } = await import("../seeds");
const { runSeeds } = await import("../src/seeds");

await runSeeds(seeds);
process.exit(0);
