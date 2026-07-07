/**
 * Pluggable write buffer for audit logs.
 *
 * The API registers a Redis-backed adapter at startup: log entries are pushed
 * to a shared buffer and bulk-inserted into Postgres by a periodic flusher,
 * turning one INSERT per audited action into one INSERT per batch. Entries
 * are fully built at enqueue time (id and createdAt included), so timestamps
 * reflect when the action happened, not when the batch was flushed.
 * Without an adapter — or when the buffer is unreachable — entries are
 * inserted directly (the previous behavior).
 */
export type LogBufferAdapter = {
  /** Appends a serialized log entry to the buffer. */
  push: (entry: string) => Promise<void>;
};

let adapter: LogBufferAdapter | null = null;

export function setLogBufferAdapter(bufferAdapter: LogBufferAdapter | null): void {
  adapter = bufferAdapter;
}

export function getLogBufferAdapter(): LogBufferAdapter | null {
  return adapter;
}
