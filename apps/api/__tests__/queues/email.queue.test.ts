import type { EmailJobData } from "@/queues/email.queue";
import type { SendEmailResult } from "@/services/email";
import type { Job } from "bullmq";

import { beforeEach, describe, expect, it, mock } from "bun:test";

let sendEmailResult: SendEmailResult = { messageId: "sent-123" };
const sendEmailMock = mock(async (_data: EmailJobData) => sendEmailResult);

mock.module("@/services/email", () => ({
  sendEmail: sendEmailMock,
  isEmailProviderConfigured: async () => true,
}));

// No Redis configured — the queue layer must fall back to inline sending
mock.module("@/queues/connection", () => ({
  getQueueConnection: () => null,
  createWorkerConnection: () => null,
}));

const { enqueueEmail } = await import("@/queues/email.queue");
const { processEmailJob, startEmailWorker } = await import("@/queues/email.worker");

const emailData: EmailJobData = {
  to: "user@example.com",
  subject: "Hello",
  html: "<p>Hi</p>",
  text: "Hi",
};

beforeEach(() => {
  sendEmailResult = { messageId: "sent-123" };
  sendEmailMock.mockClear();
});

describe("enqueueEmail without Redis", () => {
  it("sends inline and returns the send result", async () => {
    const result = await enqueueEmail(emailData);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(emailData);
    expect(result).toEqual({ messageId: "sent-123" });
  });

  it("surfaces inline send errors to the caller", async () => {
    sendEmailResult = { error: "Resend error 500" };

    const result = await enqueueEmail(emailData);

    expect(result.error).toBe("Resend error 500");
  });
});

describe("processEmailJob", () => {
  const job = { data: emailData } as Job<EmailJobData>;

  it("returns the message id on success", async () => {
    expect(await processEmailJob(job)).toBe("sent-123");
  });

  it("throws when sending fails, so BullMQ retries", async () => {
    sendEmailResult = { error: "Resend error 500" };

    expect(processEmailJob(job)).rejects.toThrow("Resend error 500");
  });
});

describe("startEmailWorker without Redis", () => {
  it("returns null so the API runs without a worker", () => {
    expect(startEmailWorker()).toBeNull();
  });
});
