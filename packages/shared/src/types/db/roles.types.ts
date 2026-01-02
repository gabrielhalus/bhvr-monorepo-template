import type { WithRelations } from "@bunstack/shared/lib/type-utils";
import type { RolesModel } from "@bunstack/shared/models/roles.model";
import type { RoleRelationsSchema } from "@bunstack/shared/schemas/api/roles.schemas";
import type { Policy } from "@bunstack/shared/types/db/policies.types";
import type { User } from "@bunstack/shared/types/db/users.types";
import type { Permission } from "@bunstack/shared/types/permissions.types";
import type z from "zod";

export type Role = typeof RolesModel.$inferSelect;

export type RoleRelations = {
  members: User[];
  permissions: Permission[];
  policies: Policy[];
};

export type RoleRelationKeys = z.infer<typeof RoleRelationsSchema>;

export type RoleWithRelations<T extends RoleRelationKeys> = WithRelations<Role, RoleRelations, T>;
