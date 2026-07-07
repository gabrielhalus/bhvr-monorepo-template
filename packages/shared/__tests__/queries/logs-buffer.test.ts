import type { LogBufferAdapter } from "../../src/log-buffer";

import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

// ── drizzle mock ─────────────────────────────────────────────────────────────

let insertedValues: unknown[] = [];
let conflictTargets: unknown[] = [];

mock.module("../../src/drizzle", () => ({
  drizzle: {
    insert: () => ({
      values: (values: unknown) => ({
        returning: async () => {
          insertedValues.push(values);
          return [{ ...(values as object), id: "db-generated", createdAt: "2026-07-07T12:00:00.000Z" }];
        },
        onConflictDoNothing: async (target: unknown) => {
          insertedValues.push(values);
          conflictTargets.push(target);
        },
      }),
    }),
  },
}));

const { setLogBufferAdapter } = await import("../../src/log-buffer");
const { createLog, createLogs } = await import("../../src/queries/logs.queries");

// ── fake buffer adapter ──────────────────────────────────────────────────────

class FakeLogBuffer implements LogBufferAdapter {
  entries: string[] = [];
  failing = false;

  async push(entry: string): Promise<void> {
    if (this.failing) throw new Error("buffer down");
    this.entries.push(entry);
  }
}

let buffer: FakeLogBuffer;

beforeEach(() => {
  insertedValues = [];
  conflictTargets = [];
  buffer = new FakeLogBuffer();
  setLogBufferAdapter(buffer);
});

afterAll(() => {
  setLogBufferAdapter(null);
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("createLog with buffer", () => {
  it("pushes a fully-built entry to the buffer instead of inserting", async () => {
    const log = await createLog({ action: "auth:login", actorId: "user-1", ip: "1.1.1.1" });

    expect(insertedValues).toHaveLength(0);
    expect(buffer.entries).toHaveLength(1);

    const entry = JSON.parse(buffer.entries[0]!);
    expect(entry.action).toBe("auth:login");
    expect(entry.actorId).toBe("user-1");
    expect(entry.id).toBeString();
    expect(entry.id).toHaveLength(21);
    expect(new Date(entry.createdAt).getTime()).toBeGreaterThan(0);

    // The returned log matches the buffered entry
    expect(log.id).toBe(entry.id);
    expect(log.createdAt).toBe(entry.createdAt);
  });

  it("falls back to a direct insert when the buffer is down", async () => {
    buffer.failing = true;

    const log = await createLog({ action: "auth:login", actorId: "user-1" });

    expect(insertedValues).toHaveLength(1);
    expect(log.id).toBe("db-generated");
  });

  it("inserts directly when no adapter is registered", async () => {
    setLogBufferAdapter(null);

    await createLog({ action: "auth:login", actorId: "user-1" });

    expect(insertedValues).toHaveLength(1);
    expect(buffer.entries).toHaveLength(0);
  });
});

describe("createLogs", () => {
  it("bulk-inserts entries idempotently", async () => {
    const logs = [
      { id: "log-1", action: "auth:login", actorId: "user-1", impersonatorId: null, targetId: null, targetType: null, metadata: null, ip: null, userAgent: null, createdAt: "2026-07-07T12:00:00.000Z" },
      { id: "log-2", action: "auth:logout", actorId: "user-1", impersonatorId: null, targetId: null, targetType: null, metadata: null, ip: null, userAgent: null, createdAt: "2026-07-07T12:01:00.000Z" },
    ];

    await createLogs(logs);

    expect(insertedValues).toHaveLength(1);
    expect(insertedValues[0]).toEqual(logs);
    expect(conflictTargets).toHaveLength(1); // onConflictDoNothing applied
  });

  it("is a no-op for an empty batch", async () => {
    await createLogs([]);
    expect(insertedValues).toHaveLength(0);
  });
});
