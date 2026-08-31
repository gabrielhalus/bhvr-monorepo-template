import { index, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

/**
 * Signup held open while the visitor fills in what the identity provider did
 * not supply. No `user_id`: the account does not exist yet — that is the point
 * of the table. An abandoned signup expires and leaves nothing behind.
 */
export const OAuthSignupTokensModel = pgTable("oauth_signup_tokens", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  profile: json("profile").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("idx_ost_provider_account").on(table.provider, table.providerAccountId),
]);
