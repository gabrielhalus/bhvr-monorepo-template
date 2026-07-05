import type { Policy } from "~shared/types/db/policies.types";
import type { Role } from "~shared/types/db/roles.types";
import type { User } from "~shared/types/db/users.types";

import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock must be declared before the module under test is imported.
// Bun hoists mock.module calls in test files.
const mockHydrateRoles = mock(async (_roles: any[]) => [] as any[]);

mock.module("~shared/queries/roles.queries", () => ({
  hydrateRoles: mockHydrateRoles,
}));

import { isAuthorized, isAuthorizedBatch } from "~shared/auth";

const ts = "2024-01-01T00:00:00.000Z";

const baseUser: User = {
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
};

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 1,
    name: "member",
    index: 0,
    isDefault: false,
    isSuperAdmin: false,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 1,
    effect: "allow",
    permission: "user:read",
    roleId: 1,
    condition: null,
    description: null,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function withRoles(roles: Role[]) {
  return { ...baseUser, roles } as User & { roles: Role[] };
}

describe("isAuthorized", () => {
  beforeEach(() => {
    mockHydrateRoles.mockReset();
  });

  it("returns true immediately for a super admin without calling hydrateRoles", async () => {
    const user = withRoles([makeRole({ isSuperAdmin: true })]);
    const result = await isAuthorized("user:read", user);
    expect(result).toBe(true);
    expect(mockHydrateRoles).not.toHaveBeenCalled();
  });

  it("returns false when user has no roles", async () => {
    mockHydrateRoles.mockResolvedValue([]);
    const user = withRoles([]);
    expect(await isAuthorized("user:read", user)).toBe(false);
  });

  it("returns true when role directly has the requested permission", async () => {
    const role = makeRole();
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: ["user:read"] as any, policies: [] }]);
    const user = withRoles([role]);
    expect(await isAuthorized("user:read", user)).toBe(true);
  });

  it("returns false when role lacks the requested permission", async () => {
    const role = makeRole();
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: ["user:create"] as any, policies: [] }]);
    const user = withRoles([role]);
    expect(await isAuthorized("user:read", user)).toBe(false);
  });

  it("returns true when a policy grants allow for the permission", async () => {
    const role = makeRole();
    const policy = makePolicy({ effect: "allow", permission: "user:read" });
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: [] as any, policies: [policy] }]);
    const user = withRoles([role]);
    expect(await isAuthorized("user:read", user)).toBe(true);
  });

  it("continues to next role when policy denies", async () => {
    const role1 = makeRole({ id: 1 });
    const role2 = makeRole({ id: 2 });
    const denyPolicy = makePolicy({ effect: "deny", permission: "user:read" });
    mockHydrateRoles.mockResolvedValue([
      { ...role1, permissions: [] as any, policies: [denyPolicy] },
      { ...role2, permissions: ["user:read"] as any, policies: [] },
    ]);
    const user = withRoles([role1, role2]);
    // policy denies role1, role2 has permission → true
    expect(await isAuthorized("user:read", user)).toBe(true);
  });

  it("returns false when policy denies and no other role grants", async () => {
    const role = makeRole();
    const denyPolicy = makePolicy({ effect: "deny", permission: "user:read" });
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: [] as any, policies: [denyPolicy] }]);
    const user = withRoles([role]);
    expect(await isAuthorized("user:read", user)).toBe(false);
  });

  it("falls through to permission check when no matching policy exists", async () => {
    const role = makeRole();
    const policy = makePolicy({ permission: "user:create", effect: "allow" });
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: ["user:read"] as any, policies: [policy] }]);
    const user = withRoles([role]);
    expect(await isAuthorized("user:read", user)).toBe(true);
  });
});

describe("isAuthorizedBatch", () => {
  beforeEach(() => {
    mockHydrateRoles.mockReset();
  });

  it("returns all true for super admin without calling hydrateRoles", async () => {
    const user = withRoles([makeRole({ isSuperAdmin: true })]);
    const checks = [{ permission: "user:read" as const }, { permission: "user:create" as const }];
    const results = await isAuthorizedBatch(checks, user);
    expect(results).toEqual([true, true]);
    expect(mockHydrateRoles).not.toHaveBeenCalled();
  });

  it("returns empty array for empty checks", async () => {
    mockHydrateRoles.mockResolvedValue([]);
    const user = withRoles([]);
    expect(await isAuthorizedBatch([], user)).toEqual([]);
  });

  it("returns correct booleans for mixed permissions", async () => {
    const role = makeRole();
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: ["user:read"] as any, policies: [] }]);
    const user = withRoles([role]);
    const checks = [{ permission: "user:read" as const }, { permission: "user:create" as const }];
    const results = await isAuthorizedBatch(checks, user);
    expect(results).toEqual([true, false]);
  });

  it("continues to next role when a policy denies in batch mode", async () => {
    const role1 = makeRole({ id: 1 });
    const role2 = makeRole({ id: 2 });
    const denyPolicy = makePolicy({ effect: "deny", permission: "user:read" });
    mockHydrateRoles.mockResolvedValue([
      { ...role1, permissions: [] as any, policies: [denyPolicy] },
      { ...role2, permissions: ["user:read"] as any, policies: [] },
    ]);
    const user = withRoles([role1, role2]);
    // role1 denies via policy → continue; role2 has direct permission → true
    const results = await isAuthorizedBatch([{ permission: "user:read" as const }], user);
    expect(results).toEqual([true]);
  });

  it("hydrates roles only once for multiple checks", async () => {
    const role = makeRole();
    mockHydrateRoles.mockResolvedValue([{ ...role, permissions: ["user:read"] as any, policies: [] }]);
    const user = withRoles([role]);
    const checks = [
      { permission: "user:read" as const },
      { permission: "user:read" as const },
      { permission: "user:create" as const },
    ];
    await isAuthorizedBatch(checks, user);
    expect(mockHydrateRoles).toHaveBeenCalledTimes(1);
  });

  it("applies policy decisions per check", async () => {
    const role = makeRole();
    const allowReadPolicy = makePolicy({ permission: "user:read", effect: "allow" });
    const denyCreatePolicy = makePolicy({ id: 2, permission: "user:create", effect: "deny" });
    mockHydrateRoles.mockResolvedValue([{
      ...role,
      permissions: [] as any,
      policies: [allowReadPolicy, denyCreatePolicy],
    }]);
    const user = withRoles([role]);
    const results = await isAuthorizedBatch([
      { permission: "user:read" as const },
      { permission: "user:create" as const },
    ], user);
    expect(results).toEqual([true, false]);
  });
});
