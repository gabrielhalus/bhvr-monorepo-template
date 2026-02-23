import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { Cron } from "croner";

import { completeCronTaskRun, createCronTaskRun, markStalledRunsAsFailed } from "~shared/queries/cron-task-runs.queries";
import { getCronTask, getEnabledCronTasks, setTaskRunTimestamps } from "~shared/queries/cron-tasks.queries";

// ============================================================================
// Handler Registry
// ============================================================================

type HandlerFn = () => Promise<string | void>;

const HANDLERS: Record<string, HandlerFn> = {
  "noop": async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return "No-op handler executed successfully";
  },

  "cleanup-expired-invitations": async () => {
    const { expireInvitations } = await import("~shared/queries/invitations.queries");
    const count = await expireInvitations();
    return `Expired ${count} pending invitation(s)`;
  },
};

export const AVAILABLE_HANDLERS = Object.keys(HANDLERS);

// ============================================================================
// Scheduler
// ============================================================================

class CronScheduler {
  private jobs = new Map<string, Cron>();

  /**
   * Start the scheduler: clean up stalled runs, then schedule all enabled tasks.
   */
  async start(): Promise<void> {
    await markStalledRunsAsFailed();

    const tasks = await getEnabledCronTasks();
    for (const task of tasks) {
      this.scheduleTask(task);
    }

    // eslint-disable-next-line no-console
    console.log(`[Scheduler] Started with ${tasks.length} task(s)`);
  }

  /**
   * Schedule a cron task. Replaces any existing job for the same task id.
   */
  scheduleTask(task: CronTask): void {
    this.unscheduleTask(task.id);

    const handler = HANDLERS[task.handler];
    if (!handler) {
      console.warn(`[Scheduler] Unknown handler "${task.handler}" for task "${task.name}" — skipping`);
      return;
    }

    try {
      const job = new Cron(task.cronExpression, { timezone: "UTC", protect: true }, async () => {
        await this.executeTask(task.id, handler);
      });

      this.jobs.set(task.id, job);

      const nextRun = job.nextRun()?.toISOString() ?? null;
      setTaskRunTimestamps(task.id, task.lastRunAt ?? new Date().toISOString(), nextRun).catch(() => {});
    } catch (err) {
      console.error(`[Scheduler] Failed to schedule task "${task.name}":`, err);
    }
  }

  /**
   * Unschedule a cron task by id.
   */
  unscheduleTask(taskId: string): void {
    const job = this.jobs.get(taskId);
    if (job) {
      job.stop();
      this.jobs.delete(taskId);
    }
  }

  /**
   * Reload a task: re-fetch from DB and reschedule or unschedule based on isEnabled.
   */
  async reload(taskId: string): Promise<void> {
    const task = await getCronTask(taskId);
    if (!task) {
      this.unscheduleTask(taskId);
      return;
    }

    if (task.isEnabled) {
      this.scheduleTask(task);
    } else {
      this.unscheduleTask(taskId);
    }
  }

  /**
   * Trigger a task immediately (manual run), bypassing the schedule.
   * @param taskId - The task id.
   * @returns The completed run record.
   */
  async triggerTask(taskId: string): Promise<ReturnType<typeof completeCronTaskRun>> {
    const task = await getCronTask(taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    const handler = HANDLERS[task.handler];
    if (!handler) {
      throw new Error(`Handler "${task.handler}" not registered`);
    }

    return this.executeTask(taskId, handler);
  }

  /**
   * Stop all scheduled jobs.
   */
  stop(): void {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
  }

  // ============================================================================
  // Private
  // ============================================================================

  private async executeTask(taskId: string, handler: HandlerFn): Promise<ReturnType<typeof completeCronTaskRun>> {
    const run = await createCronTaskRun(taskId);

    const start = Date.now();

    try {
      const output = await handler();
      const completedAt = new Date().toISOString();

      const completedRun = await completeCronTaskRun(run.id, "success", String(output ?? ""));

      const job = this.jobs.get(taskId);
      const nextRunAt = job?.nextRun()?.toISOString() ?? null;
      setTaskRunTimestamps(taskId, completedAt, nextRunAt).catch(() => {});

      return completedRun;
    } catch (err) {
      const completedAt = new Date().toISOString();
      const errorMsg = err instanceof Error ? err.message : String(err);

      console.error(`[Scheduler] Task ${taskId} failed after ${Date.now() - start}ms:`, err);

      const completedRun = await completeCronTaskRun(run.id, "error", undefined, errorMsg);

      const job = this.jobs.get(taskId);
      const nextRunAt = job?.nextRun()?.toISOString() ?? null;
      setTaskRunTimestamps(taskId, completedAt, nextRunAt).catch(() => {});

      return completedRun;
    }
  }
}

export const cronScheduler = new CronScheduler();
