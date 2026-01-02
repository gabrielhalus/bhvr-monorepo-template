import type { Permission } from "@bunstack/shared/types/permissions.types";

import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import { RolesModel } from "@bunstack/shared/models/roles.model";

export const RolePermissionsModel = pgTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => RolesModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  permission: text("permission").notNull().$type<Permission>(),
}, table => [primaryKey({ columns: [table.roleId, table.permission] })]);
