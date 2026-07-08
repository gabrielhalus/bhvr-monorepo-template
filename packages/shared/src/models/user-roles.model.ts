import { foreignKey, integer, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";

import { RolesModel } from "~shared/models/roles.model";
import { UsersModel } from "~shared/models/users.model";

/**
 * organizationId mirrors the role's org (NULL = platform role assignment).
 * The composite FK keeps it consistent for org rows; platform rows (NULL)
 * rely on the plain roleId FK.
 */
export const UserRolesModel = pgTable("user_roles", {
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  roleId: integer("role_id").notNull().references(() => RolesModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  organizationId: varchar("organization_id", { length: 21 }),
}, table => [
  primaryKey({ columns: [table.userId, table.roleId] }),
  foreignKey({
    name: "user_roles_role_org_fk",
    columns: [table.roleId, table.organizationId],
    foreignColumns: [RolesModel.id, RolesModel.organizationId],
  }).onDelete("cascade").onUpdate("cascade"),
]);
