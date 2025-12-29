import type { Permission } from "../types/permissions.types";

import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import { Roles } from "./roles.model";

export const RolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => Roles.id, { onDelete: "cascade", onUpdate: "cascade" }),
  permission: text("permission").notNull().$type<Permission>(),
}, table => [primaryKey({ columns: [table.roleId, table.permission] })]);
