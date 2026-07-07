import type { SendEmailResult } from "@/services/email";

import { Queue } from "bullmq";

import { sendEmail } from "@/services/email";

import { getQueueConnection } from "./connection";

export const EMAIL_QUEUE_NAME = "emails";

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EnqueueEmailResult = { queued: true; error?: never } | SendEmailResult;

let queue: Queue<EmailJobData> | null | undefined;

/**
 * Lazily created email queue, or null when Redis is not configured.
 */
export function getEmailQueue(): Queue<EmailJobData> | null {
  if (queue === undefined) {
    const connection = getQueueConnection();
    queue = connection
      ? new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
          connection,
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: "exponential", delay: 30 * 1000 },
            removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
            removeOnFail: { age: 7 * 24 * 60 * 60 },
          },
        })
      : null;
  }
  return queue;
}

/**
 * Queue an email for delivery with retries handled by the worker.
 * Falls back to sending inline when Redis is not configured or unreachable,
 * in which case the send result is returned directly.
 */
export async function enqueueEmail(data: EmailJobData): Promise<EnqueueEmailResult> {
  const emailQueue = getEmailQueue();

  if (emailQueue) {
    try {
      await emailQueue.add("send", data);
      return { queued: true };
    } catch (error) {
      console.error(`[Email queue] Enqueue failed, sending inline: ${error instanceof Error ? error.message : error}`);
    }
  }

  return sendEmail(data);
}
