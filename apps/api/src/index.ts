import { internal } from "varlock";
import { ENV } from "varlock/env";

const envGraph = await internal.loadVarlockEnvGraph({
  entryFilePath: new URL("../", import.meta.url).pathname,
});
await envGraph.resolveEnvValues();
// eslint-disable-next-line node/no-process-env
process.env.__VARLOCK_ENV = JSON.stringify(envGraph.getSerializedGraph());
internal.initVarlockEnv();

// Expose resolved vars that shared packages read from process.env
// eslint-disable-next-line node/no-process-env
process.env.DATABASE_URL ??= ENV.DATABASE_URL;

const { default: app } = await import("@/app");
const { cronScheduler } = await import("@/services/cron-scheduler");

// Start the cron scheduler
await cronScheduler.start();

// eslint-disable-next-line no-console
console.log(`🚀 Server is running on port ${ENV.APP_PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: ENV.APP_PORT,
});
