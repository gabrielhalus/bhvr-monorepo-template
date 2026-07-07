import type { CronJobData } from "./cron.queue";
import type { Job } from "bullmq";

import { Worker } from "bullmq";

import { executeCronTask } from "@/services/cron-handlers";
import { getCronTask, setTaskRunTimestamps } from "~shared/queries/cron-tasks.queries";

import { createWorkerConnection } from "./connection";
import { CRON_QUEUE_NAME, getCronQueue } from "./cron.queue";

/**
 * Runs the task's handler and records the run in the database.
 * Handler failures are recorded as "error" runs, not thrown — the next
 * scheduled iteration is produced by the job scheduler regardless.
 */
export async function processCronJob(job: Job<CronJobData>): Promise<string> {
  const task = await getCronTask(job.data.taskId);
  if (!task) {
    return `Task ${job.data.taskId} no longer exists — skipping`;
  }
  if (!task.isEnabled) {
    return `Task "${task.name}" is disabled — skipping`;
  }

  const run = await executeCronTask(task.id, task.handler);

  const scheduler = await getCronQueue()?.getJobScheduler(task.id).catch(() => null);
  const nextRunAt = scheduler?.next ? new Date(scheduler.next).toISOString() : null;
  await setTaskRunTimestamps(task.id, run.completedAt ?? new Date().toISOString(), nextRunAt).catch(() => {});

  return run.status === "error" ? `Run failed: ${run.error}` : (run.output ?? "");
}

/**
 * Starts the in-process cron worker, or returns null when Redis is not
 * configured (the croner-based scheduler is used instead).
 */
export function startCronWorker(): Worker<CronJobData> | null {
  const connection = createWorkerConnection();
  if (!connection) {
    return null;
  }

  const worker = new Worker<CronJobData>(CRON_QUEUE_NAME, processCronJob, {
    connection,
    concurrency: 3,
  });

  worker.on("failed", (job, error) => {
    console.error(`[Cron worker] Job failed — task: ${job?.data.taskId}: ${error.message}`);
  });

  return worker;
}
