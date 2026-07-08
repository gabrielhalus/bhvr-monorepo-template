import { index, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

import { OrganizationsModel } from "~shared/models/organizations.model";
import { UsersModel } from "~shared/models/users.model";

export const OrganizationMembersModel = pgTable("organization_members", {
  organizationId: varchar("organization_id", { length: 21 }).notNull().references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  invitedById: varchar("invited_by_id", { length: 21 }).references(() => UsersModel.id, { onDelete: "set null", onUpdate: "cascade" }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  primaryKey({ columns: [table.organizationId, table.userId] }),
  index("organization_members_user_id_idx").on(table.userId),
]);
