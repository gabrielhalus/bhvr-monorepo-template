import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const SeedsModel = pgTable("seeds", {
  id: text("id").primaryKey(),
  version: integer("version").notNull(),
  checksum: text("checksum").notNull(),
  appliedAt: timestamp("applied_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
});
