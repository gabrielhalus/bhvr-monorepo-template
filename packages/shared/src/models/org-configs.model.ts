import { pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { OrganizationsModel } from "~shared/models/organizations.model";
import { UsersModel } from "~shared/models/users.model";

/**
 * Per-organization overrides for registry entries with scope "organization".
 * Resolution order: org override → registry default.
 */
export const OrgConfigsModel = pgTable("org_configs", {
  organizationId: varchar("organization_id", { length: 21 }).notNull().references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  configKey: varchar("config_key", { length: 255 }).notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 21 }).references(() => UsersModel.id),
}, table => [
  primaryKey({ columns: [table.organizationId, table.configKey] }),
]);
