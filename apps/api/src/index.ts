import app from "@/app";
import { cronScheduler } from "@/services/cron-scheduler";

// Start the cron scheduler
await cronScheduler.start();

// eslint-disable-next-line no-console
console.log("🚀 Server is running on port 3000");

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});
