import app from "@/app";
import { cronScheduler } from "@/services/cron-scheduler";
import { seeds } from "~seeds";
import { runSeeds } from "~shared/seeds";

// Run seeds before starting the server
await runSeeds(seeds);

// Start the cron scheduler
await cronScheduler.start();

// eslint-disable-next-line no-console
console.log("🚀 Server is running on port 3000");

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});
