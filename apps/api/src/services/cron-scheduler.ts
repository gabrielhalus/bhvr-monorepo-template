import type { CronJobData } from "@/queues/cron.queue";
import type { CronTaskRun } from "~shared/queries/cron-task-runs.queries";
import type { CronTask } from "~shared/queries/cron-tasks.queries";
import type { Worker } from "bullmq";

import { Cron } from "croner";

import { getRedisUrl } from "@/lib/redis";
import { getCronQueue } from "@/queues/cron.queue";
import { startCronWorker } from "@/queues/cron.worker";
import { executeCronTask, hasCronHandler } from "@/services/cron-handlers";
import { markStalledRunsAsFailed } from "~shared/queries/cron-task-runs.queries";
import { getCronTask, getEnabledCronTasks, setTaskRunTimestamps } from "~shared/queries/cron-tasks.queries";

export type CronScheduler = {
  /** Start the scheduler: clean up stalled runs, then schedule all enabled tasks. */
  start: () => Promise<void>;
  /** Schedule a cron task. Replaces any existing schedule for the same task id. */
  scheduleTask: (task: CronTask) => Promise<void>;
  /** Unschedule a cron task by id. */
  unscheduleTask: (taskId: string) => Promise<void>;
  /** Reload a task: re-fetch from DB and reschedule or unschedule based on isEnabled. */
  reload: (taskId: string) => Promise<void>;
  /** Trigger a task immediately (manual run), bypassing the schedule. */
  triggerTask: (taskId: string) => Promise<CronTaskRun>;
  /** Stop the scheduler. */
  stop: () => Promise<void>;
};

// ============================================================================
// BullMQ implementation — used when Redis is configured. Schedules live in
// Redis job schedulers, so tasks run exactly once across API instances.
// ============================================================================

export class BullMqCronScheduler implements CronScheduler {
  private worker: Worker<CronJobData> | null = null;

  async start(): Promise<void> {
    await markStalledRunsAsFailed();

    const queue = getCronQueue();
    if (!queue) {
      throw new Error("Cron queue unavailable — is REDIS_URL set?");
    }

    const tasks = await getEnabledCronTasks();

    // Reconcile: drop schedulers whose task was deleted or disabled while the API was down
    const enabledIds = new Set(tasks.map(task => task.id));
    const schedulers = await queue.getJobSchedulers(0, -1);
    for (const scheduler of schedulers) {
      if (!enabledIds.has(scheduler.key)) {
        await queue.removeJobScheduler(scheduler.key);
      }
    }

    for (const task of tasks) {
      await this.scheduleTask(task);
    }

    this.worker = startCronWorker();

    // eslint-disable-next-line no-console
    console.log(`[Scheduler] BullMQ scheduler started with ${tasks.length} task(s)`);
  }

  async scheduleTask(task: CronTask): Promise<void> {
    if (!hasCronHandler(task.handler)) {
      console.warn(`[Scheduler] Unknown handler "${task.handler}" for task "${task.name}" — skipping`);
      return;
    }

    const queue = getCronQueue();
    if (!queue) return;

    try {
      await queue.upsertJobScheduler(
        task.id,
        { pattern: task.cronExpression, tz: "UTC" },
        { name: task.handler, data: { taskId: task.id } },
      );

      const scheduler = await queue.getJobScheduler(task.id);
      const nextRunAt = scheduler?.next ? new Date(scheduler.next).toISOString() : null;
      setTaskRunTimestamps(task.id, task.lastRunAt ?? new Date().toISOString(), nextRunAt).catch(() => {});
    } catch (err) {
      console.error(`[Scheduler] Failed to schedule task "${task.name}":`, err);
    }
  }

  async unscheduleTask(taskId: string): Promise<void> {
    await getCronQueue()?.removeJobScheduler(taskId).catch(() => {});
  }

  async reload(taskId: string): Promise<void> {
    const task = await getCronTask(taskId);
    if (task?.isEnabled) {
      await this.scheduleTask(task);
    } else {
      await this.unscheduleTask(taskId);
    }
  }

  async triggerTask(taskId: string): Promise<CronTaskRun> {
    const task = await getCronTask(taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    // Runs inline (not through the queue) so the completed run is returned to the caller
    const run = await executeCronTask(task.id, task.handler);

    const scheduler = await getCronQueue()?.getJobScheduler(task.id).catch(() => null);
    const nextRunAt = scheduler?.next ? new Date(scheduler.next).toISOString() : null;
    setTaskRunTimestamps(task.id, run.completedAt ?? new Date().toISOString(), nextRunAt).catch(() => {});

    return run;
  }

  async stop(): Promise<void> {
    await this.worker?.close();
    this.worker = null;
  }
}

// ============================================================================
// Croner implementation — in-process fallback when Redis is not configured.
// With multiple API instances, every instance runs every task.
// ============================================================================

export class CronerCronScheduler implements CronScheduler {
  private jobs = new Map<string, Cron>();

  async start(): Promise<void> {
    await markStalledRunsAsFailed();

    const tasks = await getEnabledCronTasks();
    for (const task of tasks) {
      await this.scheduleTask(task);
    }

    // eslint-disable-next-line no-console
    console.log(`[Scheduler] In-process scheduler started with ${tasks.length} task(s)`);
  }

  async scheduleTask(task: CronTask): Promise<void> {
    await this.unscheduleTask(task.id);

    if (!hasCronHandler(task.handler)) {
      console.warn(`[Scheduler] Unknown handler "${task.handler}" for task "${task.name}" — skipping`);
      return;
    }

    try {
      const job = new Cron(task.cronExpression, { timezone: "UTC", protect: true }, async () => {
        await this.runTask(task.id, task.handler);
      });

      this.jobs.set(task.id, job);

      const nextRun = job.nextRun()?.toISOString() ?? null;
      setTaskRunTimestamps(task.id, task.lastRunAt ?? new Date().toISOString(), nextRun).catch(() => {});
    } catch (err) {
      console.error(`[Scheduler] Failed to schedule task "${task.name}":`, err);
    }
  }

  async unscheduleTask(taskId: string): Promise<void> {
    const job = this.jobs.get(taskId);
    if (job) {
      job.stop();
      this.jobs.delete(taskId);
    }
  }

  async reload(taskId: string): Promise<void> {
    const task = await getCronTask(taskId);
    if (task?.isEnabled) {
      await this.scheduleTask(task);
    } else {
      await this.unscheduleTask(taskId);
    }
  }

  async triggerTask(taskId: string): Promise<CronTaskRun> {
    const task = await getCronTask(taskId);
    if (!task) {
      throw new Error(`Task "${taskId}" not found`);
    }

    return this.runTask(task.id, task.handler);
  }

  async stop(): Promise<void> {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
  }

  private async runTask(taskId: string, handlerName: string): Promise<CronTaskRun> {
    const run = await executeCronTask(taskId, handlerName);

    const job = this.jobs.get(taskId);
    const nextRunAt = job?.nextRun()?.toISOString() ?? null;
    setTaskRunTimestamps(taskId, run.completedAt ?? new Date().toISOString(), nextRunAt).catch(() => {});

    return run;
  }
}

export const cronScheduler: CronScheduler = getRedisUrl() ? new BullMqCronScheduler() : new CronerCronScheduler();
