const { seeds } = await import("../seeds");
const { runSeeds } = await import("../src/seeds");

await runSeeds(seeds);
process.exit(0);
