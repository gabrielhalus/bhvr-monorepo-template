import { getRedis } from "@/lib/redis";
import { setLogBufferAdapter } from "~shared/log-buffer";
import { createLogs } from "~shared/queries/logs.queries";
import { LogSchema } from "~shared/schemas/db/logs.schemas";

const BUFFER_KEY = "audit-logs:buffer";
/** Oldest entries are dropped beyond this, bounding Redis memory during a DB outage. */
const MAX_BUFFER_LENGTH = 10_000;
const FLUSH_INTERVAL_MS = 5 * 1000;
const FLUSH_BATCH_SIZE = 500;

/**
 * Registers a Redis-backed adapter for the shared log buffer: audit logs are
 * pushed to a shared Redis list instead of being inserted one by one.
 * No-op when REDIS_URL is not configured — logs are then inserted directly.
 * @returns Whether the buffer was registered.
 */
export function registerAuditLogBuffer(): boolean {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  setLogBufferAdapter({
    async push(entry) {
      await redis.lpush(BUFFER_KEY, entry);
      await redis.ltrim(BUFFER_KEY, 0, MAX_BUFFER_LENGTH - 1);
    },
  });

  return true;
}

/**
 * Drain one batch from the buffer into Postgres.
 * On insert failure, entries are pushed back for the next tick; the bulk
 * insert is idempotent on id, so retrying a partial batch is safe.
 * @returns The number of entries flushed.
 */
export async function flushAuditLogs(): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  const entries = await redis.rpop(BUFFER_KEY, FLUSH_BATCH_SIZE);
  if (!entries || entries.length === 0) {
    return 0;
  }

  // Poison entries (unparseable or malformed) are dropped rather than blocking the batch
  const logs = entries.flatMap((entry) => {
    try {
      const parsed = LogSchema.safeParse(JSON.parse(entry));
      return parsed.success ? [parsed.data] : [];
    } catch {
      return [];
    }
  });

  try {
    await createLogs(logs);
    return logs.length;
  } catch (err) {
    console.error(`[Audit flusher] Failed to insert ${logs.length} log(s), requeueing:`, err);
    await redis.rpush(BUFFER_KEY, ...entries).catch(() => {
      console.error(`[Audit flusher] Requeue failed — ${entries.length} audit log(s) lost`);
    });
    return 0;
  }
}

/**
 * Starts the periodic flusher that drains the audit log buffer into Postgres.
 * Every API instance may run one; batches are popped atomically so entries
 * are only processed once.
 * @returns The flush interval timer, or null when Redis is not configured.
 */
export function startAuditLogFlusher(): ReturnType<typeof setInterval> | null {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const interval = setInterval(() => {
    flushAuditLogs().catch(() => {});
  }, FLUSH_INTERVAL_MS);

  if (typeof interval.unref === "function") {
    interval.unref();
  }

  return interval;
}
