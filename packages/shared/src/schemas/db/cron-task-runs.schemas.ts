import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { CronTaskRunsModel } from "~shared/models/cron-task-runs.model";

export const CronTaskRunSchema = createSelectSchema(CronTaskRunsModel, {
  status: z.enum(["running", "success", "error"]),
});
