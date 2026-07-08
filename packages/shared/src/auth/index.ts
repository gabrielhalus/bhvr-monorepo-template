import type { Policy } from "../types/db/policies.types";
import type { Role, RoleWithRelations } from "../types/db/roles.types";
import type { UserWithRelations } from "../types/db/users.types";
import type { Permission } from "../types/permissions.types";

import { hydrateRoles } from "../queries/roles.queries";
import { getRoleCacheAdapter, ROLE_CACHE_TTL_SECONDS } from "../role-cache";
import { evaluatePolicies } from "./evaluate-policy";

type AuthRole = RoleWithRelations<["permissions", "policies"]>;
type RoleAuthData = { permissions: Permission[]; policies: Policy[] };

/**
 * Hydrate roles with their permissions and policies, served from the role
 * cache when an adapter is registered. Only missing roles hit the database,
 * and cache failures fall back to a full hydration.
 */
async function hydrateRolesCached(roles: Role[]): Promise<AuthRole[]> {
  const cache = getRoleCacheAdapter();
  if (!cache) {
    return hydrateRoles(roles, ["permissions", "policies"]);
  }

  const cached = new Map<number, RoleAuthData>();
  try {
    const hits = await cache.getMany(roles.map(role => role.id));
    for (const [roleId, serialized] of hits) {
      cached.set(roleId, JSON.parse(serialized) as RoleAuthData);
    }
  } catch {
    // Cache unavailable or corrupt entry — fall back to the database
  }

  const missing = roles.filter(role => !cached.has(role.id));

  const fetched = new Map<number, AuthRole>();
  if (missing.length > 0) {
    const hydrated = await hydrateRoles(missing, ["permissions", "policies"]);
    const entries = new Map<number, string>();
    for (const role of hydrated) {
      fetched.set(role.id, role);
      entries.set(role.id, JSON.stringify({ permissions: role.permissions ?? [], policies: role.policies ?? [] }));
    }
    cache.setMany(entries, ROLE_CACHE_TTL_SECONDS).catch(() => {});
  }

  return roles.map((role) => {
    const data = cached.get(role.id);
    if (data) {
      return { ...role, permissions: data.permissions, policies: data.policies } as AuthRole;
    }
    return fetched.get(role.id) ?? ({ ...role, permissions: [], policies: [] } as AuthRole);
  });
}

/**
 * Check if a user has a specific permission
 * @param permission - The permission to check
 * @param user - The user with roles
 * @param resource - Optional resource context for policy evaluation
 * @returns True if the user has the permission, false otherwise
 */
export async function isAuthorized(permission: Permission, user: UserWithRelations<["roles"]>, resource?: Record<string, unknown>): Promise<boolean> {
  // The super-admin bypass is platform-only: org roles always go through
  // explicit permissions and policies.
  if (user.roles.some(role => role.isSuperAdmin && role.organizationId === null)) {
    return true;
  }

  const hydratedRoles = await hydrateRolesCached(user.roles);

  for (const role of hydratedRoles) {
    const { policies, permissions } = role;

    if (policies?.length) {
      const policyDecision = evaluatePolicies(policies, permission, user, resource);

      if (policyDecision === "allow") {
        return true;
      }

      if (policyDecision === "deny") {
        continue;
      }
    }

    if (permissions?.includes(permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Check multiple permissions at once, hydrating roles only once
 * @param checks - Array of permission/resource pairs to evaluate
 * @param user - The user with roles
 * @returns Array of booleans corresponding to each check
 */
export async function isAuthorizedBatch(
  checks: Array<{ permission: Permission; resource?: Record<string, unknown> }>,
  user: UserWithRelations<["roles"]>,
): Promise<boolean[]> {
  if (user.roles.some(role => role.isSuperAdmin && role.organizationId === null)) {
    return checks.map(() => true);
  }

  const hydratedRoles = await hydrateRolesCached(user.roles);

  return checks.map(({ permission, resource }) => {
    for (const role of hydratedRoles) {
      const { policies, permissions } = role;

      if (policies?.length) {
        const policyDecision = evaluatePolicies(policies, permission, user, resource);

        if (policyDecision === "allow") {
          return true;
        }

        if (policyDecision === "deny") {
          continue;
        }
      }

      if (permissions?.includes(permission)) {
        return true;
      }
    }

    return false;
  });
}
