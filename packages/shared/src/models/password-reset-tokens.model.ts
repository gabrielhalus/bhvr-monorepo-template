import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

import { UsersModel } from "./users.model";

export const PasswordResetTokensModel = pgTable("password_reset_tokens", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 21 }).notNull().references(() => UsersModel.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "string", withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("idx_prt_user_id").on(table.userId),
]);
