import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { AuditLogsModel } from "~shared/models/audit-logs.model";

export const AuditLogSchema = createSelectSchema(AuditLogsModel);

export const InsertAuditLogSchema = createInsertSchema(AuditLogsModel);
