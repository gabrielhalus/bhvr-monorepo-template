import type { EmailJobData } from "./email.queue";
import type { Job } from "bullmq";

import { Worker } from "bullmq";

import { sendEmail } from "@/services/email";

import { createWorkerConnection } from "./connection";
import { EMAIL_QUEUE_NAME } from "./email.queue";

/**
 * Sends the email and throws on failure so BullMQ retries with backoff.
 */
export async function processEmailJob(job: Job<EmailJobData>): Promise<string> {
  const result = await sendEmail(job.data);
  if (result.error !== undefined) {
    throw new Error(result.error);
  }
  return result.messageId;
}

/**
 * Starts the in-process email worker, or returns null when Redis is not
 * configured (emails are then sent inline by enqueueEmail).
 */
export function startEmailWorker(): Worker<EmailJobData> | null {
  const connection = createWorkerConnection();
  if (!connection) {
    return null;
  }

  const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection,
    concurrency: 5,
  });

  worker.on("failed", (job, error) => {
    const attempt = job ? `${job.attemptsMade}/${job.opts.attempts ?? 1}` : "?";
    console.error(`[Email worker] Send failed (attempt ${attempt}) — to: ${job?.data.to}, subject: ${job?.data.subject}: ${error.message}`);
  });

  worker.on("completed", (job, messageId) => {
    // eslint-disable-next-line no-console
    console.log(`[Email worker] Sent — to: ${job.data.to}, id: ${messageId}`);
  });

  return worker;
}
