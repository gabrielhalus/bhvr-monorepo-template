import { boolean, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core";

import { OrganizationsModel } from "~shared/models/organizations.model";
import { UsersModel } from "~shared/models/users.model";

/**
 * DB overrides for the feature flag registry (source of truth in code,
 * src/feature-flags.registry.ts). A NULL organizationId is a platform-wide
 * override; resolution order: org override → platform override → registry default.
 */
export const FeatureFlagOverridesModel = pgTable("feature_flag_overrides", {
  flagKey: varchar("flag_key", { length: 64 }).notNull(),
  organizationId: varchar("organization_id", { length: 21 }).references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  enabled: boolean("enabled").notNull(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 21 }).references(() => UsersModel.id),
}, table => [
  unique("feature_flag_overrides_flag_org_unique").on(table.flagKey, table.organizationId).nullsNotDistinct(),
]);
