/* eslint-disable no-console */
/* eslint-disable node/no-process-env */

import { internal } from "varlock";
import { ENV } from "varlock/env";

const envGraph = await internal.loadVarlockEnvGraph({
  entryFilePath: new URL("../", import.meta.url).pathname,
});

await envGraph.resolveEnvValues();

process.env.__VARLOCK_ENV = JSON.stringify(envGraph.getSerializedGraph());
internal.initVarlockEnv();

// Expose resolved vars that shared packages read from process.env
process.env.DATABASE_URL ??= ENV.DATABASE_URL;

if (ENV.SYSTEM_RESET_PASSWORD) {
  const { resetSystemPassword } = await import("~shared/queries/users.queries");
  const result = await resetSystemPassword();

  if (result) {
    console.log(`🔑 System account password reset: ${result.email} → ${result.password}`);
    console.log("Store this password securely. Set SYSTEM_RESET_PASSWORD=false to disable.");
  } else {
    console.log("🔑 No system account found — run bootstrap first.");
  }
}

const { registerConfigCache } = await import("@/lib/config-cache");
const { registerTokenCache } = await import("@/lib/token-cache");
const { registerRoleCache } = await import("@/lib/role-cache");
const { registerOrgCache } = await import("@/lib/org-cache");
const { registerFeatureFlagCache } = await import("@/lib/feature-flag-cache");
const { registerTranslationCache } = await import("@/lib/translation-cache");

if (registerConfigCache()) {
  console.log("⚡ Config cache enabled (Redis)");
}
if (registerTokenCache()) {
  console.log("⚡ Session token cache enabled (Redis)");
}
if (registerRoleCache()) {
  console.log("⚡ Role permission cache enabled (Redis)");
}
if (registerOrgCache()) {
  console.log("⚡ Org resolution cache enabled (Redis)");
}
if (registerFeatureFlagCache()) {
  console.log("⚡ Feature flag cache enabled (Redis)");
}
if (registerTranslationCache()) {
  console.log("⚡ Translation override cache enabled (Redis)");
}

const { registerAuditLogBuffer, startAuditLogFlusher } = await import("@/services/audit-log-flusher");

if (registerAuditLogBuffer()) {
  startAuditLogFlusher();
  console.log("⚡ Audit log batching enabled (Redis)");
}

const { default: app } = await import("@/app");
const { cronScheduler } = await import("@/services/cron-scheduler");
const { startEmailWorker } = await import("@/queues/email.worker");

await cronScheduler.start();

if (startEmailWorker()) {
  console.log("📬 Email worker started");
}

console.log(`🚀 Server is running on port ${ENV.APP_PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: ENV.APP_PORT,
});
