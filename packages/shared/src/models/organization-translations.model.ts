import { pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { OrganizationsModel } from "~shared/models/organizations.model";
import { UsersModel } from "~shared/models/users.model";

/**
 * Per-organization wording overrides layered on top of the bundled i18n
 * resources. `key` is the dot-path within the namespace (e.g. "nav.home").
 */
export const OrganizationTranslationsModel = pgTable("organization_translations", {
  organizationId: varchar("organization_id", { length: 21 }).notNull().references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  locale: varchar("locale", { length: 10 }).notNull(),
  namespace: varchar("namespace", { length: 32 }).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 21 }).references(() => UsersModel.id),
}, table => [
  primaryKey({ columns: [table.organizationId, table.locale, table.namespace, table.key] }),
]);
