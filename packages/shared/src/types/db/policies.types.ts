import type { WithRelations } from "~shared/lib/type-utils";
import type { PoliciesModel } from "~shared/db/models/policies.model";
import type { Role } from "~shared/types/db/roles.types";
import type { Permission } from "~shared/types/permissions.types";

export type Policy = typeof PoliciesModel.$inferSelect;

export type PolicyRelations = {
  roles: Role[];
  permissions: Permission[];
};

export type PolicyWithRelations<T extends (keyof PolicyRelations)[]> = WithRelations<Policy, PolicyRelations, T>;
