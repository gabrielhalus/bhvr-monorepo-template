import { Queue } from "bullmq";

import { getQueueConnection } from "./connection";

export const CRON_QUEUE_NAME = "cron-tasks";

export type CronJobData = {
  taskId: string;
};

let queue: Queue<CronJobData> | null | undefined;

/**
 * Lazily created cron task queue, or null when Redis is not configured.
 * Run history lives in Postgres, so completed/failed jobs are pruned quickly.
 */
export function getCronQueue(): Queue<CronJobData> | null {
  if (queue === undefined) {
    const connection = getQueueConnection();
    queue = connection
      ? new Queue<CronJobData>(CRON_QUEUE_NAME, {
          connection,
          defaultJobOptions: {
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 100 },
          },
        })
      : null;
  }
  return queue;
}
