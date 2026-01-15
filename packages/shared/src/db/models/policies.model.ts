import type { Permission } from "~shared/types/permissions.types";

import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { RolesModel } from "./roles.model";

export const PoliciesModel = pgTable("policies", {
  id: serial("id").primaryKey(),
  effect: varchar("effect", { length: 8 }).$type<"allow" | "deny">().notNull(),
  permission: text("permission").$type<Permission>(),
  roleId: integer("role_id").references(() => RolesModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  condition: text("condition"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});
