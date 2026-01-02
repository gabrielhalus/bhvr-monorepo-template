import type { WithRelations } from "@bunstack/shared/lib/type-utils";
import type { PoliciesModel } from "@bunstack/shared/models/policies.model";
import type { Role } from "@bunstack/shared/types/db/roles.types";
import type { Permission } from "@bunstack/shared/types/permissions.types";

export type Policy = typeof PoliciesModel.$inferSelect;

export type PolicyRelations = {
  roles: Role[];
  permissions: Permission[];
};

export type PolicyWithRelations<T extends (keyof PolicyRelations)[]> = WithRelations<Policy, PolicyRelations, T>;
