import type { ConfigCacheAdapter } from "../../src/config-cache";

import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

// ── drizzle mock ─────────────────────────────────────────────────────────────

let dbOverrides: { configKey: string; value: string | null; updatedAt: string | null; updatedBy: string | null }[] = [];
let selectCount = 0;

mock.module("../../src/drizzle", () => ({
  drizzle: {
    select: () => ({
      from: () => ({
        where: async () => {
          selectCount++;
          return dbOverrides;
        },
      }),
    }),
    insert: () => ({ values: () => ({ onConflictDoUpdate: async () => {} }) }),
    delete: () => ({ where: async () => {} }),
  },
}));

const { CONFIG_REGISTRY } = await import("../../src/config.registry");
const { setConfigCacheAdapter } = await import("../../src/config-cache");
const { getConfig, getConfigs, updateConfig } = await import("../../src/queries/configs.queries");

// ── fake cache adapter ───────────────────────────────────────────────────────

class FakeCacheAdapter implements ConfigCacheAdapter {
  store = new Map<string, string>();
  failing = false;

  async getMany(keys: string[]): Promise<Map<string, string>> {
    if (this.failing) throw new Error("cache down");
    return new Map(keys.filter(k => this.store.has(k)).map(k => [k, this.store.get(k)!]));
  }

  async setMany(entries: Map<string, string>, _ttlSeconds: number): Promise<void> {
    if (this.failing) throw new Error("cache down");
    for (const [key, value] of entries) {
      this.store.set(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    if (this.failing) throw new Error("cache down");
    // eslint-disable-next-line drizzle/enforce-delete-with-where -- Map.delete, not a drizzle query
    this.store.delete(key);
  }
}

const [keyA, keyB] = CONFIG_REGISTRY.map(entry => entry.key) as [string, string];
let cache: FakeCacheAdapter;

beforeEach(() => {
  dbOverrides = [];
  selectCount = 0;
  cache = new FakeCacheAdapter();
  setConfigCacheAdapter(cache);
});

afterAll(() => {
  setConfigCacheAdapter(null);
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("getConfigs with cache", () => {
  it("populates the cache on a miss and serves the next read from it", async () => {
    await getConfigs([keyA]);
    expect(selectCount).toBe(1);
    expect(cache.store.has(keyA)).toBe(true);

    const [config] = await getConfigs([keyA]);
    expect(selectCount).toBe(1); // no second DB query
    expect(config?.configKey).toBe(keyA);
  });

  it("only queries the database for keys missing from the cache", async () => {
    await getConfigs([keyA]);
    expect(selectCount).toBe(1);

    const configs = await getConfigs([keyA, keyB]);
    expect(selectCount).toBe(2); // one more query, for keyB only
    expect(configs.map(c => c.configKey)).toEqual([keyA, keyB]);
    expect(cache.store.has(keyB)).toBe(true);
  });

  it("returns cached values including database overrides", async () => {
    dbOverrides = [{ configKey: keyA, value: "overridden", updatedAt: "2026-07-07T12:00:00.000Z", updatedBy: "user-1" }];
    await getConfigs([keyA]);

    dbOverrides = [];
    const [config] = await getConfigs([keyA]);
    expect(config?.value).toBe("overridden");
    expect(config?.isOverridden).toBe(true);
  });

  it("falls back to the database when the cache is down", async () => {
    cache.failing = true;

    const [config] = await getConfigs([keyA]);
    expect(config?.configKey).toBe(keyA);
    expect(selectCount).toBe(1);
  });

  it("bypasses the cache when no adapter is registered", async () => {
    setConfigCacheAdapter(null);

    await getConfigs([keyA]);
    await getConfigs([keyA]);
    expect(selectCount).toBe(2);
    expect(cache.store.size).toBe(0);
  });
});

describe("getConfig with cache", () => {
  it("reads through the cache", async () => {
    await getConfig(keyA);
    const config = await getConfig(keyA);
    expect(selectCount).toBe(1);
    expect(config?.configKey).toBe(keyA);
  });

  it("returns null for a key missing from the registry", async () => {
    expect(await getConfig("does.not.exist")).toBeNull();
    expect(selectCount).toBe(0);
  });
});

describe("updateConfig invalidation", () => {
  it("drops the cached entry when a config is updated", async () => {
    await getConfigs([keyA]);
    expect(cache.store.has(keyA)).toBe(true);

    await updateConfig(keyA, "new-value", "user-1");
    expect(cache.store.has(keyA)).toBe(false);
  });

  it("drops the cached entry when a config is reset to its default", async () => {
    const entry = CONFIG_REGISTRY.find(e => e.key === keyA)!;
    await getConfigs([keyA]);

    await updateConfig(keyA, entry.defaultValue, "user-1");
    expect(cache.store.has(keyA)).toBe(false);
  });

  it("does not fail the write when cache invalidation is unavailable", async () => {
    await getConfigs([keyA]);
    cache.failing = true;

    const config = await updateConfig(keyA, "new-value", "user-1");
    expect(config.value).toBe("new-value");
  });
});
