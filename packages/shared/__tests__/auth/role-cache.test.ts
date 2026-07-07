import type { RoleCacheAdapter } from "../../src/role-cache";
import type { Policy } from "~shared/types/db/policies.types";
import type { Role } from "~shared/types/db/roles.types";
import type { User } from "~shared/types/db/users.types";

import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

// ── mocks ────────────────────────────────────────────────────────────────────

let hydrationData: Record<number, { permissions: string[]; policies: Policy[] }> = {};

const mockHydrateRoles = mock(async (roles: Role[]) =>
  roles.map(role => ({
    ...role,
    permissions: hydrationData[role.id]?.permissions ?? [],
    policies: hydrationData[role.id]?.policies ?? [],
  })));

mock.module("~shared/queries/roles.queries", () => ({
  hydrateRoles: mockHydrateRoles,
}));

const { isAuthorized, isAuthorizedBatch } = await import("~shared/auth");
const { setRoleCacheAdapter } = await import("../../src/role-cache");

// ── fixtures ─────────────────────────────────────────────────────────────────

const ts = "2026-01-01T00:00:00.000Z";

const baseUser = {
  id: "user_abc123",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  password: null,
  avatar: null,
  preferences: null,
  metadata: null,
  verifiedAt: null,
  createdAt: ts,
  updatedAt: ts,
} as User;

function makeRole(id: number, overrides: Partial<Role> = {}): Role {
  return {
    id,
    name: `role-${id}`,
    index: 0,
    isDefault: false,
    isSuperAdmin: false,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function withRoles(roles: Role[]) {
  return { ...baseUser, roles };
}

class FakeRoleCache implements RoleCacheAdapter {
  store = new Map<number, string>();
  failing = false;

  async getMany(roleIds: number[]): Promise<Map<number, string>> {
    if (this.failing) throw new Error("cache down");
    return new Map(roleIds.filter(id => this.store.has(id)).map(id => [id, this.store.get(id)!]));
  }

  async setMany(entries: Map<number, string>, _ttlSeconds: number): Promise<void> {
    if (this.failing) throw new Error("cache down");
    for (const [roleId, value] of entries) {
      this.store.set(roleId, value);
    }
  }

  async remove(roleIds: number[]): Promise<void> {
    if (this.failing) throw new Error("cache down");
    for (const roleId of roleIds) {
      // eslint-disable-next-line drizzle/enforce-delete-with-where -- Map.delete, not a drizzle query
      this.store.delete(roleId);
    }
  }
}

let cache: FakeRoleCache;

beforeEach(() => {
  hydrationData = {};
  cache = new FakeRoleCache();
  setRoleCacheAdapter(cache);
  mockHydrateRoles.mockClear();
});

afterAll(() => {
  setRoleCacheAdapter(null);
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("isAuthorized with role cache", () => {
  it("hydrates on a miss, caches, then authorizes from the cache", async () => {
    hydrationData = { 1: { permissions: ["user:read"], policies: [] } };
    const user = withRoles([makeRole(1)]);

    expect(await isAuthorized("user:read", user)).toBe(true);
    expect(mockHydrateRoles).toHaveBeenCalledTimes(1);
    expect(cache.store.has(1)).toBe(true);

    expect(await isAuthorized("user:read", user)).toBe(true);
    expect(mockHydrateRoles).toHaveBeenCalledTimes(1); // served from the cache
  });

  it("authorizes from a pre-populated cache without hydrating", async () => {
    cache.store.set(1, JSON.stringify({ permissions: ["user:read"], policies: [] }));
    const user = withRoles([makeRole(1)]);

    expect(await isAuthorized("user:read", user)).toBe(true);
    expect(mockHydrateRoles).not.toHaveBeenCalled();
  });

  it("denies from cached data that lacks the permission", async () => {
    cache.store.set(1, JSON.stringify({ permissions: ["user:read"], policies: [] }));
    const user = withRoles([makeRole(1)]);

    expect(await isAuthorized("user:delete", user)).toBe(false);
  });

  it("hydrates only the roles missing from the cache", async () => {
    cache.store.set(1, JSON.stringify({ permissions: [], policies: [] }));
    hydrationData = { 2: { permissions: ["user:read"], policies: [] } };
    const user = withRoles([makeRole(1), makeRole(2)]);

    expect(await isAuthorized("user:read", user)).toBe(true);
    expect(mockHydrateRoles).toHaveBeenCalledTimes(1);
    const hydratedIds = (mockHydrateRoles.mock.calls[0]![0] as Role[]).map(r => r.id);
    expect(hydratedIds).toEqual([2]);
  });

  it("evaluates cached policies", async () => {
    const denyPolicy = {
      id: 1,
      effect: "deny",
      permission: "user:read",
      roleId: 1,
      condition: null,
      description: null,
      createdAt: ts,
      updatedAt: ts,
    } as Policy;
    cache.store.set(1, JSON.stringify({ permissions: ["user:read"], policies: [denyPolicy] }));
    const user = withRoles([makeRole(1)]);

    expect(await isAuthorized("user:read", user)).toBe(false);
  });

  it("falls back to hydration when the cache is down", async () => {
    cache.failing = true;
    hydrationData = { 1: { permissions: ["user:read"], policies: [] } };
    const user = withRoles([makeRole(1)]);

    expect(await isAuthorized("user:read", user)).toBe(true);
    expect(mockHydrateRoles).toHaveBeenCalledTimes(1);
  });

  it("hydrates every time when no adapter is registered", async () => {
    setRoleCacheAdapter(null);
    hydrationData = { 1: { permissions: ["user:read"], policies: [] } };
    const user = withRoles([makeRole(1)]);

    await isAuthorized("user:read", user);
    await isAuthorized("user:read", user);
    expect(mockHydrateRoles).toHaveBeenCalledTimes(2);
    expect(cache.store.size).toBe(0);
  });

  it("does not touch the cache for super admins", async () => {
    const user = withRoles([makeRole(1, { isSuperAdmin: true })]);

    expect(await isAuthorized("user:read", user)).toBe(true);
    expect(mockHydrateRoles).not.toHaveBeenCalled();
    expect(cache.store.size).toBe(0);
  });
});

describe("isAuthorizedBatch with role cache", () => {
  it("serves batch checks from the cache", async () => {
    cache.store.set(1, JSON.stringify({ permissions: ["user:read"], policies: [] }));
    const user = withRoles([makeRole(1)]);

    const results = await isAuthorizedBatch(
      [{ permission: "user:read" }, { permission: "user:delete" }],
      user,
    );

    expect(results).toEqual([true, false]);
    expect(mockHydrateRoles).not.toHaveBeenCalled();
  });
});
