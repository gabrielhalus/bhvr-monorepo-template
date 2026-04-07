import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { SqlSheetsModel } from "~shared/models/sql-sheets.model";

export const SqlSheetSchema = createSelectSchema(SqlSheetsModel);

export const InsertSqlSheetSchema = createInsertSchema(SqlSheetsModel)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1).max(255).default("Untitled"),
    query: z.string().default(""),
  });

export const UpdateSqlSheetSchema = createUpdateSchema(SqlSheetsModel)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();
