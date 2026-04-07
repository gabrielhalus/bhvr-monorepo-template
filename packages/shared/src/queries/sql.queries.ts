import { sql } from "drizzle-orm";

import { drizzle } from "../drizzle";

export type SqlQueryResult = {
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  duration: number;
};

export type TableColumn = {
  columnName: string;
  dataType: string;
  isNullable: boolean;
};

export type TableSchema = {
  tableName: string;
  columns: TableColumn[];
};

/**
 * Execute a raw SQL query against the database
 * @param query - The raw SQL query string
 * @returns Query results with rows, rowCount, and execution duration in ms
 */
export async function executeRawSql(query: string): Promise<SqlQueryResult> {
  const start = Date.now();
  try {
    const result = await drizzle.execute(sql.raw(query)) as unknown as Array<Record<string, unknown>> & { count: number };
    const duration = Date.now() - start;
    const rows = Array.from(result);
    return {
      rows,
      rowCount: rows.length > 0 ? rows.length : (result.count ?? 0),
      duration,
    };
  }
  catch (err) {
    // Reset the connection to clear any aborted transaction state (e.g. from a failed BEGIN)
    // Without this, postgres returns the connection to the pool in an aborted state,
    // causing all subsequent requests on that connection to fail with "25P02".
    try { await drizzle.execute(sql.raw("ROLLBACK")); } catch { /* already outside a transaction, ignore */ }
    throw err;
  }
}

/**
 * Get the public schema table structure from information_schema
 * @returns Array of tables with their columns
 */
export async function getDatabaseSchema(): Promise<TableSchema[]> {
  const result = await drizzle.execute(sql`
    SELECT
      table_name   AS "tableName",
      column_name  AS "columnName",
      data_type    AS "dataType",
      is_nullable  AS "isNullable"
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `) as unknown as Array<{ tableName: string; columnName: string; dataType: string; isNullable: string }>;

  const tableMap = new Map<string, TableColumn[]>();

  for (const row of Array.from(result)) {
    if (!tableMap.has(row.tableName)) {
      tableMap.set(row.tableName, []);
    }
    tableMap.get(row.tableName)!.push({
      columnName: row.columnName,
      dataType: row.dataType,
      isNullable: row.isNullable === "YES",
    });
  }

  return Array.from(tableMap.entries()).map(([tableName, columns]) => ({ tableName, columns }));
}
