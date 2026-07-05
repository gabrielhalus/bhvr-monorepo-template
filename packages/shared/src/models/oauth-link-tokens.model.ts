import { index, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

import { UsersModel } from "./users.model";

export const OAuthLinkTokensModel = pgTable("oauth_link_tokens", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  profile: json("profile").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("idx_olt_user_id").on(table.userId),
]);
