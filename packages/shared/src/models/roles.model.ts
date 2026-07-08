import { boolean, integer, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

import { OrganizationsModel } from "~shared/models/organizations.model";

/**
 * Roles are org-scoped (organizationId set) or platform-scoped (NULL).
 * `isSuperAdmin` only grants the authorization bypass on platform roles;
 * org "owner" roles carry the full permission list instead.
 */
export const RolesModel = pgTable("roles", {
  id: serial("id").primaryKey(),
  organizationId: varchar("organization_id", { length: 21 }).references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  index: integer("index").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique("roles_org_name_unique").on(table.organizationId, table.name).nullsNotDistinct(),
  unique("roles_org_index_unique").on(table.organizationId, table.index).nullsNotDistinct(),
  // Target of the composite FK on user_roles (role can't be assigned under the wrong org)
  unique("roles_id_org_unique").on(table.id, table.organizationId),
]);
