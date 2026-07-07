import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";

import { completeCronTaskRun, createCronTaskRun } from "~shared/queries/cron-task-runs.queries";

// ============================================================================
// Handler Registry
// ============================================================================

type HandlerFn = () => Promise<string | void>;

export const HANDLERS: Record<string, HandlerFn> = {
  "noop": async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return "No-op handler executed successfully";
  },

  "daily-db-backup": async () => {
    const { isS3BackupConfigured, runDatabaseBackup } = await import("@/services/db-backup");
    if (!await isS3BackupConfigured()) return "S3 backup not configured — skipping";
    return runDatabaseBackup();
  },

  "local-db-backup": async () => {
    const { backupToLocal } = await import("@/services/db-backup");
    return backupToLocal();
  },

  "cleanup-expired-invitations": async () => {
    const { expireInvitations } = await import("~shared/queries/invitations.queries");
    const count = await expireInvitations();
    return `Expired ${count} pending invitation(s)`;
  },
};

export const AVAILABLE_HANDLERS = Object.keys(HANDLERS);

export function hasCronHandler(handlerName: string): boolean {
  return handlerName in HANDLERS;
}

// ============================================================================
// Execution
// ============================================================================

/**
 * Run a task's handler and record the run in the database.
 * Never throws for handler failures — those are recorded as an "error" run.
 * @param taskId - The task id.
 * @param handlerName - The registered handler to execute.
 * @returns The completed run record.
 */
export async function executeCronTask(taskId: string, handlerName: string): Promise<CronTaskRun> {
  const handler = HANDLERS[handlerName];
  if (!handler) {
    throw new Error(`Handler "${handlerName}" not registered`);
  }

  const run = await createCronTaskRun(taskId);
  const start = Date.now();

  try {
    const output = await handler();
    return await completeCronTaskRun(run.id, "success", String(output ?? ""));
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Cron] Task ${taskId} failed after ${Date.now() - start}ms:`, err);
    return await completeCronTaskRun(run.id, "error", undefined, errorMsg);
  }
}
