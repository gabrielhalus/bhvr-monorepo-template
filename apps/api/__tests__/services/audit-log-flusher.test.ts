import type { Log } from "~shared/types/db/logs.types";

import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

// ── fakes ────────────────────────────────────────────────────────────────────

/** Minimal Redis list implementation (lpush/ltrim/rpop/rpush). */
class FakeRedisList {
  list: string[] = []; // head = index 0

  async lpush(_key: string, entry: string): Promise<number> {
    this.list.unshift(entry);
    return this.list.length;
  }

  async ltrim(_key: string, start: number, stop: number): Promise<void> {
    this.list = this.list.slice(start, stop + 1);
  }

  async rpop(_key: string, count: number): Promise<string[] | null> {
    if (this.list.length === 0) return null;
    return this.list.splice(-count).reverse();
  }

  async rpush(_key: string, ...entries: string[]): Promise<number> {
    this.list.push(...entries);
    return this.list.length;
  }
}

let fakeRedis: FakeRedisList | null;

mock.module("@/lib/redis", () => ({
  getRedis: () => fakeRedis,
  getRedisUrl: () => (fakeRedis ? "redis://fake" : undefined),
}));

let createLogsError: Error | null = null;
const createLogsMock = mock(async (_logs: Log[]) => {
  if (createLogsError) throw createLogsError;
});

mock.module("~shared/queries/logs.queries", () => ({
  createLogs: createLogsMock,
}));

const { flushAuditLogs, registerAuditLogBuffer } = await import("@/services/audit-log-flusher");
const { getLogBufferAdapter, setLogBufferAdapter } = await import("~shared/log-buffer");

function makeEntry(id: string): string {
  return JSON.stringify({
    id,
    action: "auth:login",
    actorId: "user-1",
    impersonatorId: null,
    targetId: null,
    targetType: null,
    metadata: null,
    ip: null,
    userAgent: null,
    createdAt: "2026-07-07T12:00:00.000Z",
  });
}

beforeEach(() => {
  fakeRedis = new FakeRedisList();
  createLogsError = null;
  createLogsMock.mockClear();
  setLogBufferAdapter(null);
});

afterAll(() => {
  // Back to "Redis not configured" so other test files are unaffected
  fakeRedis = null;
  setLogBufferAdapter(null);
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("registerAuditLogBuffer", () => {
  it("registers an adapter that pushes to the Redis list", async () => {
    expect(registerAuditLogBuffer()).toBe(true);

    await getLogBufferAdapter()!.push(makeEntry("log-1"));
    expect(fakeRedis!.list).toHaveLength(1);
  });

  it("returns false without Redis and registers nothing", () => {
    fakeRedis = null;
    setLogBufferAdapter(null);

    expect(registerAuditLogBuffer()).toBe(false);
    expect(getLogBufferAdapter()).toBeNull();
  });
});

describe("flushAuditLogs", () => {
  it("drains the buffer into a single bulk insert, oldest first", async () => {
    await fakeRedis!.lpush("k", makeEntry("log-1"));
    await fakeRedis!.lpush("k", makeEntry("log-2"));

    const flushed = await flushAuditLogs();

    expect(flushed).toBe(2);
    expect(createLogsMock).toHaveBeenCalledTimes(1);
    const batch = createLogsMock.mock.calls[0]![0];
    expect(batch.map(l => l.id)).toEqual(["log-1", "log-2"]);
    expect(fakeRedis!.list).toHaveLength(0);
  });

  it("returns 0 when the buffer is empty", async () => {
    expect(await flushAuditLogs()).toBe(0);
    expect(createLogsMock).not.toHaveBeenCalled();
  });

  it("drops poison entries instead of blocking the batch", async () => {
    await fakeRedis!.lpush("k", makeEntry("log-1"));
    await fakeRedis!.lpush("k", "not json at all");
    await fakeRedis!.lpush("k", JSON.stringify({ id: "missing-fields" }));

    const flushed = await flushAuditLogs();

    expect(flushed).toBe(1);
    expect(createLogsMock.mock.calls[0]![0].map(l => l.id)).toEqual(["log-1"]);
  });

  it("requeues the batch when the insert fails", async () => {
    await fakeRedis!.lpush("k", makeEntry("log-1"));
    createLogsError = new Error("db down");

    const flushed = await flushAuditLogs();

    expect(flushed).toBe(0);
    expect(fakeRedis!.list).toHaveLength(1); // back in the buffer for the next tick
  });
});
