import { index, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

import { UsersModel } from "./users.model";

export const OAuthAccountsModel = pgTable("oauth_accounts", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique("uq_oauth_accounts_provider_account").on(table.provider, table.providerAccountId),
  unique("uq_oauth_accounts_user_provider").on(table.userId, table.provider),
  index("idx_oauth_accounts_user_id").on(table.userId),
]);
