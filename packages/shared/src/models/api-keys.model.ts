import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

import { OrganizationsModel } from "./organizations.model";
import { UsersModel } from "./users.model";

export const ApiKeysModel = pgTable("api_keys", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  /** Key locked to an organization; NULL = platform key. Org resolution for API-key requests comes from the key, not the Host header. */
  organizationId: varchar("organization_id", { length: 21 }).references(() => OrganizationsModel.id, { onDelete: "cascade", onUpdate: "cascade" }),
  prefix: varchar("prefix", { length: 16 }).notNull().unique(),
  secretHash: text("secret_hash").notNull(),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { mode: "string", withTimezone: true }),
  revokedAt: timestamp("revoked_at", { mode: "string", withTimezone: true }),
});
