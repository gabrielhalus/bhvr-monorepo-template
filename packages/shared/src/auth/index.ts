import type { UserWithRelations } from "../types/db/users.types";
import type { Permission } from "../types/permissions.types";

import { hydrateRoles } from "../queries/roles.queries";
import { evaluatePolicies } from "./evaluate-policy";

/**
 * Check if a user has a specific permission
 * @param permission - The permission to check
 * @param user - The user with roles
 * @param resource - Optional resource context for policy evaluation
 * @returns True if the user has the permission, false otherwise
 */
export async function isAuthorized(permission: Permission, user: UserWithRelations<["roles"]>, resource?: Record<string, unknown>): Promise<boolean> {
  if (user.roles.some(role => role.isSuperAdmin)) {
    return true;
  }

  const hydratedRoles = await hydrateRoles(user.roles, ["permissions", "policies"]);

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
  if (user.roles.some(role => role.isSuperAdmin)) {
    return checks.map(() => true);
  }

  const hydratedRoles = await hydrateRoles(user.roles, ["permissions", "policies"]);

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
