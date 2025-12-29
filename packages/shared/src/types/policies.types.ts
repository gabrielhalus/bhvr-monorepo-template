import type { Policies } from "../models/policies.model";
import type { Permission } from "./permissions.types";
import type { Role } from "./roles.types";
import type { WithRelations } from "@/lib/type-utils";

export type Policy = typeof Policies.$inferSelect;

export type PolicyRelations = {
  roles: Role[];
  permissions: Permission[];
};

export type PolicyWithRelations<T extends (keyof PolicyRelations)[]> = WithRelations<Policy, PolicyRelations, T>;
