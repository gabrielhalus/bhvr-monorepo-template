import type { TokenCacheAdapter } from "../../src/token-cache";
import type { Token } from "../../src/types/db/tokens.types";

import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

// ── drizzle mock ─────────────────────────────────────────────────────────────

let dbTokens: Partial<Token>[] = [];
let selectCount = 0;

mock.module("../../src/drizzle", () => ({
  drizzle: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            selectCount++;
            return dbTokens;
          },
        }),
      }),
    }),
    update: () => ({
      set: () => ({ where: () => ({ returning: async () => dbTokens }) }),
    }),
    delete: () => ({
      where: () => ({ returning: async () => dbTokens }),
    }),
  },
}));

const { setTokenCacheAdapter } = await import("../../src/token-cache");
const {
  deleteToken,
  getToken,
  revokeAllTokensByUserId,
  revokeToken,
} = await import("../../src/queries/tokens.queries");

// ── fake cache adapter ───────────────────────────────────────────────────────

class FakeTokenCache implements TokenCacheAdapter {
  store = new Map<string, string>();
  failing = false;

  async get(id: string): Promise<string | null> {
    if (this.failing) throw new Error("cache down");
    return this.store.get(id) ?? null;
  }

  async set(id: string, value: string, _ttlSeconds: number): Promise<void> {
    if (this.failing) throw new Error("cache down");
    this.store.set(id, value);
  }

  async remove(ids: string[]): Promise<void> {
    if (this.failing) throw new Error("cache down");
    for (const id of ids) {
      // eslint-disable-next-line drizzle/enforce-delete-with-where -- Map.delete, not a drizzle query
      this.store.delete(id);
    }
  }
}

function makeToken(id: string): Partial<Token> {
  return {
    id,
    userId: "user-1",
    issuedAt: "2026-07-07T10:00:00.000Z",
    expiresAt: "2026-07-14T10:00:00.000Z",
    revokedAt: null,
  };
}

let cache: FakeTokenCache;

beforeEach(() => {
  dbTokens = [];
  selectCount = 0;
  cache = new FakeTokenCache();
  setTokenCacheAdapter(cache);
});

afterAll(() => {
  setTokenCacheAdapter(null);
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("getToken with cache", () => {
  it("caches an existing token and serves the next lookup from the cache", async () => {
    dbTokens = [makeToken("jti-1")];

    await getToken("jti-1");
    expect(selectCount).toBe(1);
    expect(cache.store.has("jti-1")).toBe(true);

    const token = await getToken("jti-1");
    expect(selectCount).toBe(1); // no second DB query
    expect(token?.id).toBe("jti-1");
    expect(token?.revokedAt).toBeNull();
  });

  it("does not cache misses", async () => {
    dbTokens = [];

    expect(await getToken("unknown")).toBeNull();
    expect(await getToken("unknown")).toBeNull();
    expect(selectCount).toBe(2);
    expect(cache.store.size).toBe(0);
  });

  it("falls back to the database when the cache is down", async () => {
    dbTokens = [makeToken("jti-1")];
    cache.failing = true;

    const token = await getToken("jti-1");
    expect(token?.id).toBe("jti-1");
    expect(selectCount).toBe(1);
  });

  it("bypasses the cache when no adapter is registered", async () => {
    setTokenCacheAdapter(null);
    dbTokens = [makeToken("jti-1")];

    await getToken("jti-1");
    await getToken("jti-1");
    expect(selectCount).toBe(2);
    expect(cache.store.size).toBe(0);
  });
});

describe("token mutations invalidate the cache", () => {
  it("revokeToken drops the cached entry", async () => {
    dbTokens = [makeToken("jti-1")];
    await getToken("jti-1");
    expect(cache.store.has("jti-1")).toBe(true);

    await revokeToken("jti-1");
    expect(cache.store.has("jti-1")).toBe(false);
  });

  it("deleteToken drops the cached entry", async () => {
    dbTokens = [makeToken("jti-1")];
    await getToken("jti-1");

    await deleteToken("jti-1");
    expect(cache.store.has("jti-1")).toBe(false);
  });

  it("revokeAllTokensByUserId drops every deleted token from the cache", async () => {
    dbTokens = [makeToken("jti-1")];
    await getToken("jti-1");
    dbTokens = [makeToken("jti-2")];
    await getToken("jti-2");
    expect(cache.store.size).toBe(2);

    dbTokens = [makeToken("jti-1"), makeToken("jti-2")];
    await revokeAllTokensByUserId("user-1");
    expect(cache.store.size).toBe(0);
  });

  it("does not fail the mutation when cache invalidation is unavailable", async () => {
    dbTokens = [makeToken("jti-1")];
    await getToken("jti-1");
    cache.failing = true;

    const token = await revokeToken("jti-1");
    expect(token.id).toBe("jti-1");
  });
});
