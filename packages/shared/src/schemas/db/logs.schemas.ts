import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { LogsModel } from "~shared/models/logs.model";

export const LogSchema = createSelectSchema(LogsModel);

export const InsertLogSchema = createInsertSchema(LogsModel);
