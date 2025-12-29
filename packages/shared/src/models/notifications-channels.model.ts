import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { nanoid } from "@/lib/nanoid";

export const NotificationChannels = pgTable("notification_channels", {
  id: text("id").primaryKey().$defaultFn(nanoid),
  type: text("type", { enum: ["DISCORD", "TELEGRAM", "SLACK"] }).notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});
