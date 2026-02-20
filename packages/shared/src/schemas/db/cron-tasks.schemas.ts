import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { CronTasksModel } from "~shared/models/cron-tasks.model";

export const CronTaskSchema = createSelectSchema(CronTasksModel);

export const InsertCronTaskSchema = createInsertSchema(CronTasksModel)
  .omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true, nextRunAt: true })
  .extend({
    name: z.string().min(1).max(100),
    cronExpression: z.string().min(1).max(100),
    handler: z.string().min(1).max(100),
    isEnabled: z.boolean().optional().default(true),
  });

export const UpdateCronTaskSchema = createUpdateSchema(CronTasksModel)
  .omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true, nextRunAt: true })
  .partial();
