import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

export const TokensModel = pgTable("tokens", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 21 }).notNull(),
  issuedAt: timestamp("issued_at", { mode: "string" }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  revokedAt: timestamp("revoked_at", { mode: "string" }),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 45 }),
});
