import type { Policy } from "~shared/types/db/policies.types";
import type { UserWithRelations } from "~shared/types/db/users.types";
import type { Permission } from "~shared/types/permissions.types";

import { evaluateCondition } from "./evaluate-condition";

export function evaluatePolicies(policies: Policy[], permission: Permission, user: UserWithRelations<["roles"]>, resource?: Record<string, unknown>): "allow" | "deny" | "none" {
  for (const policy of policies) {
    if (policy.permission !== permission) {
      continue;
    }

    const satisfiesCondition = policy.condition
      ? evaluateCondition(policy.condition, user, resource)
      : true;

    if (satisfiesCondition) {
      return policy.effect;
    }
  }

  return "none";
}
