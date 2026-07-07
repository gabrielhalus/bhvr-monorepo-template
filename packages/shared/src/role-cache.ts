/**
 * Pluggable cache for role authorization data (permissions and policies),
 * keyed by role id.
 *
 * Authorization checks hydrate every role's permissions and policies from
 * the database; the API registers a Redis-backed adapter at startup so that
 * hydration usually skips Postgres. Role permissions and policies are seeded
 * at bootstrap and immutable at runtime, so the only invalidation point is
 * role deletion — the TTL covers out-of-band changes (e.g. re-running
 * bootstrap or manual DB edits). Without an adapter — or when the cache is
 * unreachable — hydration falls back to the database (the previous behavior).
 */
export type RoleCacheAdapter = {
  /** Returns the cached serialized auth data found among the given role ids. */
  getMany: (roleIds: number[]) => Promise<Map<number, string>>;
  /** Stores serialized auth data with the given TTL. */
  setMany: (entries: Map<number, string>, ttlSeconds: number) => Promise<void>;
  /** Removes role entries from the cache — called when a role is deleted. */
  remove: (roleIds: number[]) => Promise<void>;
};

export const ROLE_CACHE_TTL_SECONDS = 5 * 60;

let adapter: RoleCacheAdapter | null = null;

export function setRoleCacheAdapter(cacheAdapter: RoleCacheAdapter | null): void {
  adapter = cacheAdapter;
}

export function getRoleCacheAdapter(): RoleCacheAdapter | null {
  return adapter;
}
