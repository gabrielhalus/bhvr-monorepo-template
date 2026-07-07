import type { CronTask } from "~shared/queries/cron-tasks.queries";

import { beforeEach, describe, expect, it, mock } from "bun:test";

// ── mocks ────────────────────────────────────────────────────────────────────

const createCronTaskRunMock = mock(async (taskId: string) => ({ id: `run-${taskId}`, taskId, status: "running" }));
const completeCronTaskRunMock = mock(async (runId: string, status: string, output?: string, error?: string) =>
  ({ id: runId, status, output, error, completedAt: "2026-07-07T12:00:00.000Z" }));

mock.module("~shared/queries/cron-task-runs.queries", () => ({
  createCronTaskRun: createCronTaskRunMock,
  completeCronTaskRun: completeCronTaskRunMock,
  markStalledRunsAsFailed: mock(async () => {}),
}));

let tasks: CronTask[] = [];

const setTaskRunTimestampsMock = mock(async () => {});

mock.module("~shared/queries/cron-tasks.queries", () => ({
  getEnabledCronTasks: async () => tasks.filter(t => t.isEnabled),
  getCronTask: async (id: string) => tasks.find(t => t.id === id) ?? null,
  setTaskRunTimestamps: setTaskRunTimestampsMock,
}));

/** Minimal stand-in for a BullMQ queue's job scheduler API. */
class FakeCronQueue {
  schedulers = new Map<string, { pattern: string; tz?: string; name: string; data: unknown; next: number }>();

  async upsertJobScheduler(id: string, repeat: { pattern: string; tz?: string }, template: { name: string; data: unknown }) {
    this.schedulers.set(id, { ...repeat, ...template, next: Date.now() + 60_000 });
  }

  async getJobScheduler(id: string) {
    const scheduler = this.schedulers.get(id);
    return scheduler ? { key: id, ...scheduler } : undefined;
  }

  async getJobSchedulers(_start: number, _end: number) {
    return [...this.schedulers.entries()].map(([key, s]) => ({ key, ...s }));
  }

  async removeJobScheduler(id: string) {
    return this.schedulers.delete(id);
  }
}

let fakeQueue: FakeCronQueue;

mock.module("@/queues/cron.queue", () => ({
  CRON_QUEUE_NAME: "cron-tasks",
  getCronQueue: () => fakeQueue,
}));

const startCronWorkerMock = mock(() => null);

mock.module("@/queues/cron.worker", () => ({
  startCronWorker: startCronWorkerMock,
}));

const { executeCronTask, HANDLERS } = await import("@/services/cron-handlers");
const { BullMqCronScheduler } = await import("@/services/cron-scheduler");

function makeTask(overrides: Partial<CronTask>): CronTask {
  return {
    id: "task-1",
    name: "Test task",
    handler: "noop",
    cronExpression: "0 3 * * *",
    isEnabled: true,
    lastRunAt: null,
    nextRunAt: null,
    ...overrides,
  } as CronTask;
}

beforeEach(() => {
  tasks = [];
  fakeQueue = new FakeCronQueue();
  createCronTaskRunMock.mockClear();
  completeCronTaskRunMock.mockClear();
  setTaskRunTimestampsMock.mockClear();
  startCronWorkerMock.mockClear();
});

// ── executeCronTask ──────────────────────────────────────────────────────────

describe("executeCronTask", () => {
  it("records a success run with the handler output", async () => {
    const run = await executeCronTask("task-1", "noop");

    expect(createCronTaskRunMock).toHaveBeenCalledWith("task-1");
    expect(completeCronTaskRunMock).toHaveBeenCalledWith("run-task-1", "success", "No-op handler executed successfully");
    expect(run.status).toBe("success");
  });

  it("records an error run when the handler throws", async () => {
    HANDLERS["always-fails"] = async () => {
      throw new Error("boom");
    };

    try {
      const run = await executeCronTask("task-1", "always-fails");
      expect(completeCronTaskRunMock).toHaveBeenCalledWith("run-task-1", "error", undefined, "boom");
      expect(run.status).toBe("error");
    } finally {
      delete HANDLERS["always-fails"];
    }
  });

  it("throws for an unregistered handler", () => {
    expect(executeCronTask("task-1", "does-not-exist")).rejects.toThrow("Handler \"does-not-exist\" not registered");
  });
});

// ── BullMqCronScheduler ──────────────────────────────────────────────────────

describe("BullMqCronScheduler", () => {
  it("schedules enabled tasks as job schedulers on start", async () => {
    tasks = [makeTask({ id: "task-1" })];

    const scheduler = new BullMqCronScheduler();
    await scheduler.start();

    const jobScheduler = await fakeQueue.getJobScheduler("task-1");
    expect(jobScheduler?.pattern).toBe("0 3 * * *");
    expect(jobScheduler?.tz).toBe("UTC");
    expect(jobScheduler?.data).toEqual({ taskId: "task-1" });
    expect(startCronWorkerMock).toHaveBeenCalledTimes(1);
  });

  it("removes orphaned job schedulers on start", async () => {
    await fakeQueue.upsertJobScheduler("deleted-task", { pattern: "* * * * *" }, { name: "noop", data: {} });
    tasks = [makeTask({ id: "task-1" })];

    const scheduler = new BullMqCronScheduler();
    await scheduler.start();

    expect(await fakeQueue.getJobScheduler("deleted-task")).toBeUndefined();
    expect(await fakeQueue.getJobScheduler("task-1")).toBeDefined();
  });

  it("skips tasks with an unknown handler", async () => {
    const scheduler = new BullMqCronScheduler();
    await scheduler.scheduleTask(makeTask({ handler: "does-not-exist" }));

    expect(fakeQueue.schedulers.size).toBe(0);
  });

  it("updates the task's next run timestamp when scheduling", async () => {
    const scheduler = new BullMqCronScheduler();
    await scheduler.scheduleTask(makeTask({ id: "task-1" }));

    expect(setTaskRunTimestampsMock).toHaveBeenCalled();
    const [taskId, , nextRunAt] = setTaskRunTimestampsMock.mock.calls[0] as unknown as [string, string, string | null];
    expect(taskId).toBe("task-1");
    expect(nextRunAt).not.toBeNull();
  });

  it("unschedules a task by removing its job scheduler", async () => {
    const scheduler = new BullMqCronScheduler();
    await scheduler.scheduleTask(makeTask({ id: "task-1" }));

    await scheduler.unscheduleTask("task-1");

    expect(fakeQueue.schedulers.size).toBe(0);
  });

  it("reload unschedules a disabled task and reschedules an enabled one", async () => {
    const task = makeTask({ id: "task-1" });
    tasks = [task];

    const scheduler = new BullMqCronScheduler();
    await scheduler.reload("task-1");
    expect(fakeQueue.schedulers.size).toBe(1);

    task.isEnabled = false;
    await scheduler.reload("task-1");
    expect(fakeQueue.schedulers.size).toBe(0);
  });

  it("triggerTask runs the handler inline and returns the completed run", async () => {
    tasks = [makeTask({ id: "task-1" })];

    const scheduler = new BullMqCronScheduler();
    const run = await scheduler.triggerTask("task-1");

    expect(run.status).toBe("success");
    expect(createCronTaskRunMock).toHaveBeenCalledWith("task-1");
  });

  it("triggerTask throws for an unknown task", () => {
    const scheduler = new BullMqCronScheduler();
    expect(scheduler.triggerTask("missing")).rejects.toThrow("Task \"missing\" not found");
  });
});
