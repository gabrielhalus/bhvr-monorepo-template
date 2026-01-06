import type { UserWithRelations } from "../types/db/users.types";
import type { Permission } from "../types/permissions.types";

import { hydrateRoles } from "../queries/roles.queries";
import { evaluateCondition } from "./evaluate-condition";

/**
 * Check if a user has a specific permission
 * @param permission - The permission to check
 * @param user - The user with roles
 * @param resource - Optional resource context for policy evaluation
 * @returns True if the user has the permission, false otherwise
 */
export async function isAuthorized(permission: Permission, user: UserWithRelations<["roles"]>, resource?: Record<string, unknown>): Promise<boolean> {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }

  if (user.roles.some(role => role.isSuperAdmin)) {
    return true;
  }

  const hydratedRoles = await hydrateRoles(user.roles, ["permissions", "policies"]);

  for (const role of hydratedRoles) {
    const { policies, permissions } = role;

    if (!policies || policies.length === 0) {
      if (permissions?.includes(permission)) {
        return true;
      }
      continue;
    }

    for (const policy of policies) {
      const satisfiesCondition = policy.condition
        ? evaluateCondition(policy.condition, user, resource)
        : true;

      if (satisfiesCondition && policy.effect === "allow") {
        return true;
      }

      if (satisfiesCondition && policy.effect === "deny") {
        return false;
      }
    }

    if (permissions?.includes(permission)) {
      return true;
    }
  }

  return false;
}

export { evaluateCondition, resolveOperand } from "./evaluate-condition";
