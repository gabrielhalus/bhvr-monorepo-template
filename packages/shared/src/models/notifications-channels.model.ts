import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

export const NotificationChannelsModel = pgTable("notification_channels", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(nanoid),
  type: varchar("type", { length: 16 }).$type<"DISCORD" | "TELEGRAM" | "SLACK">().notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
});
