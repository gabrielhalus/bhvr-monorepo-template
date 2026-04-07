import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { createSqlSheet, deleteSqlSheet, getSqlSheet, getSqlSheets, updateSqlSheet } from "~shared/queries/sql-sheets.queries";
import { executeRawSql, getDatabaseSchema } from "~shared/queries/sql.queries";
import { InsertSqlSheetSchema, UpdateSqlSheetSchema } from "~shared/schemas/db/sql-sheets.schemas";

const ExecuteSqlSchema = z.object({
  query: z.string().min(1),
});

export const sqlRoutes = new Hono()
  // --- All routes require authentication
  .use(getSessionContext)

  /**
   * Execute a raw SQL query against the database
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with rows, rowCount, and execution duration
   * @access protected
   * @permission sql:execute
   */
  .post("/execute", validationMiddleware("json", ExecuteSqlSchema), requirePermissionFactory("sql:execute"), async (c) => {
    const { query } = c.req.valid("json");

    try {
      const result = await executeRawSql(query);
      return c.json({ success: true as const, data: result });
    }
    catch (err) {
      return c.json({
        success: false as const,
        error: err instanceof Error ? err.message : "Query execution failed",
      }, 400);
    }
  })

  /**
   * Get database table schema from information_schema
   *
   * @param c - The Hono context object
   * @returns JSON response with table schemas
   * @access protected
   * @permission sql:execute
   */
  .get("/tables", requirePermissionFactory("sql:execute"), async (c) => {
    const tables = await getDatabaseSchema();
    return c.json({ success: true as const, data: tables });
  })

  /**
   * List all SQL sheets
   *
   * @param c - The Hono context object
   * @returns JSON response with all sheets
   * @access protected
   * @permission sql:execute
   */
  .get("/sheets", requirePermissionFactory("sql:execute"), async (c) => {
    const sheets = await getSqlSheets();
    return c.json({ success: true as const, data: sheets });
  })

  /**
   * Create a new SQL sheet
   *
   * @param c - The Hono context object
   * @returns JSON response with the created sheet
   * @access protected
   * @permission sql:execute
   */
  .post("/sheets", validationMiddleware("json", InsertSqlSheetSchema), requirePermissionFactory("sql:execute"), async (c) => {
    const data = c.req.valid("json");
    const sheet = await createSqlSheet(data);
    return c.json({ success: true as const, data: sheet }, 201);
  })

  /**
   * Update a SQL sheet
   *
   * @param c - The Hono context object
   * @returns JSON response with the updated sheet
   * @access protected
   * @permission sql:execute
   */
  .patch("/sheets/:id", validationMiddleware("json", UpdateSqlSheetSchema), requirePermissionFactory("sql:execute"), async (c) => {
    const { id } = c.req.param();
    const data = c.req.valid("json");

    const existing = await getSqlSheet(id);
    if (!existing) {
      return c.json({ success: false as const, error: "Sheet not found" }, 404);
    }

    const sheet = await updateSqlSheet(id, data);
    return c.json({ success: true as const, data: sheet });
  })

  /**
   * Delete a SQL sheet
   *
   * @param c - The Hono context object
   * @returns JSON response with success status
   * @access protected
   * @permission sql:execute
   */
  .delete("/sheets/:id", requirePermissionFactory("sql:execute"), async (c) => {
    const { id } = c.req.param();

    const existing = await getSqlSheet(id);
    if (!existing) {
      return c.json({ success: false as const, error: "Sheet not found" }, 404);
    }

    await deleteSqlSheet(id);
    return c.json({ success: true as const });
  });
