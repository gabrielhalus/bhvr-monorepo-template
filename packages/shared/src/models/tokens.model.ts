import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

export const TokensModel = pgTable("tokens", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull(),
  issuedAt: timestamp("issued_at", { mode: "string" }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  revokedAt: timestamp("revoked_at", { mode: "string" }),
  userAgent: text("user_agent"),
  ip: text("ip"),
});
