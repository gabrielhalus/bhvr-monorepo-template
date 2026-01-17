import { integer, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";

import { RolesModel } from "~shared/models/roles.model";
import { UsersModel } from "~shared/models/users.model";

export const UserRolesModel = pgTable("user_roles", {
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  roleId: integer("role_id").notNull().references(() => RolesModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, table => [
  primaryKey({ columns: [table.userId, table.roleId] }),
]);
