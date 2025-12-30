import type { RolesModel } from "../models/roles.model";
import type { Permission } from "./permissions.types";
import type { Policy } from "./policies.types";
import type { User } from "./users.types";
import type { WithRelations } from "@/lib/type-utils";
import type { RoleRelationsSchema } from "@/schemas/api/roles.schemas";
import type z from "zod";

export type Role = typeof RolesModel.$inferSelect;

export type RoleRelations = {
  members: User[];
  permissions: Permission[];
  policies: Policy[];
};

export type RoleRelationKeys = z.infer<typeof RoleRelationsSchema>;

export type RoleWithRelations<T extends RoleRelationKeys> = WithRelations<Role, RoleRelations, T>;
