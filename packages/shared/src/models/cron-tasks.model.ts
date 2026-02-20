import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";

export const CronTasksModel = pgTable("cron_tasks", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  handler: varchar("handler", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { mode: "string", withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { mode: "string", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("idx_cron_tasks_is_enabled").on(table.isEnabled),
]);
