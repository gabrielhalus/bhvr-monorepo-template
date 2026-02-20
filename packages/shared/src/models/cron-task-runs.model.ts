import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { nanoid } from "~shared/lib/nanoid";
import { CronTasksModel } from "~shared/models/cron-tasks.model";

export const CronTaskRunsModel = pgTable("cron_task_runs", {
  id: varchar("id", { length: 21 }).primaryKey().$defaultFn(() => nanoid()),
  taskId: varchar("task_id", { length: 21 }).notNull().references(() => CronTasksModel.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 10 }).notNull().$type<"running" | "success" | "error">(),
  startedAt: timestamp("started_at", { mode: "string", withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { mode: "string", withTimezone: true }),
  durationMs: integer("duration_ms"),
  output: text("output"),
  error: text("error"),
}, table => [
  index("idx_cron_task_runs_task_id").on(table.taskId),
  index("idx_cron_task_runs_started_at").on(table.startedAt),
  index("idx_cron_task_runs_status").on(table.status),
]);
