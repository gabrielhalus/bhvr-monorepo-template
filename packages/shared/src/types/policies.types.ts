import type { PoliciesModel } from "../models/policies.model";
import type { Permission } from "./permissions.types";
import type { Role } from "./roles.types";
import type { WithRelations } from "@/lib/type-utils";

export type Policy = typeof PoliciesModel.$inferSelect;

export type PolicyRelations = {
  roles: Role[];
  permissions: Permission[];
};

export type PolicyWithRelations<T extends (keyof PolicyRelations)[]> = WithRelations<Policy, PolicyRelations, T>;
