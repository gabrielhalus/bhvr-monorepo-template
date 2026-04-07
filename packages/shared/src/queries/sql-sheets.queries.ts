import type { z } from "zod";

import { asc, eq } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { SqlSheetsModel } from "../models/sql-sheets.model";
import { InsertSqlSheetSchema, SqlSheetSchema, UpdateSqlSheetSchema } from "../schemas/db/sql-sheets.schemas";

export type SqlSheet = z.infer<typeof SqlSheetSchema>;
export type InsertSqlSheet = z.infer<typeof InsertSqlSheetSchema>;
export type UpdateSqlSheet = z.infer<typeof UpdateSqlSheetSchema>;

export async function getSqlSheets(): Promise<SqlSheet[]> {
  return drizzle.select().from(SqlSheetsModel).orderBy(asc(SqlSheetsModel.createdAt));
}

export async function getSqlSheet(id: string): Promise<SqlSheet | null> {
  const [sheet] = await drizzle.select().from(SqlSheetsModel).where(eq(SqlSheetsModel.id, id)).limit(1);
  return sheet ?? null;
}

export async function createSqlSheet(data: InsertSqlSheet): Promise<SqlSheet> {
  const [sheet] = await drizzle.insert(SqlSheetsModel).values(data).returning();
  return sheet!;
}

export async function updateSqlSheet(id: string, data: UpdateSqlSheet): Promise<SqlSheet | null> {
  const [sheet] = await drizzle
    .update(SqlSheetsModel)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(SqlSheetsModel.id, id))
    .returning();
  return sheet ?? null;
}

export async function deleteSqlSheet(id: string): Promise<void> {
  await drizzle.delete(SqlSheetsModel).where(eq(SqlSheetsModel.id, id));
}
