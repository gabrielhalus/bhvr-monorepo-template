import app from "@/app";
import { runSeeds } from "~shared/seeds";
import { seeds } from "~seeds";

// Run seeds before starting the server
await runSeeds(seeds);

// eslint-disable-next-line no-console
console.log("🚀 Server is running on port 3000");

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});
