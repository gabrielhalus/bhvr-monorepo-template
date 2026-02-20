import { createSelectSchema } from "drizzle-zod";

import { CronTaskRunsModel } from "~shared/models/cron-task-runs.model";

export const CronTaskRunSchema = createSelectSchema(CronTaskRunsModel);
