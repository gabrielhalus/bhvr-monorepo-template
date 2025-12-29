import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import { Roles } from "./roles.model";
import { Users } from "./users.model";

export const UserRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => Users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  roleId: integer("role_id").notNull().references(() => Roles.id, { onDelete: "cascade", onUpdate: "cascade" }),
}, table => [
  primaryKey({ columns: [table.userId, table.roleId] }),
]);
