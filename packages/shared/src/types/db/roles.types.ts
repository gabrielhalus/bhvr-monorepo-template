import type { RolesModel } from "~shared/models/roles.model";
import type { WithRelations } from "~shared/lib/type-utils";
import type { RoleRelationsSchema } from "~shared/schemas/api/roles.schemas";
import type { Policy } from "~shared/types/db/policies.types";
import type { User } from "~shared/types/db/users.types";
import type { Permission } from "~shared/types/permissions.types";
import type z from "zod";

export type Role = typeof RolesModel.$inferSelect;

export type RoleRelations = {
  members: User[];
  permissions: Permission[];
  policies: Policy[];
};

export type RoleRelationKeys = z.infer<typeof RoleRelationsSchema>;

export type RoleWithRelations<T extends RoleRelationKeys> = WithRelations<Role, RoleRelations, T>;
