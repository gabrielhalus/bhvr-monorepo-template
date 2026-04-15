import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { auditList } from "@/middlewares/audit";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteAllLogs, getLogsPaginated } from "~shared/queries/logs.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";

const LogsQuerySchema = PaginationQuerySchema.extend({
  action: z.string().optional(),
  actionCategory: z.string().optional(),
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  includeImpersonated: z.coerce.boolean().optional().default(false),
});

export const logsRoutes = new Hono()
  // --- All routes require authentication
  .use(getSessionContext)

  /**
   * Get paginated logs
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated logs
   * @throws {500} If an error occurs while retrieving logs
   * @access protected
   * @permission log:list
   */
  .get("/", validationMiddleware("query", LogsQuerySchema), requirePermissionFactory("log:list"), auditList("log:list", "log"), async (c) => {
    const { page, limit, sortBy, sortOrder, search, action, actionCategory, actorId, targetId, targetType, includeImpersonated } = c.req.valid("query");

    const result = await getLogsPaginated({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      action,
      actionCategory,
      actorId,
      targetId,
      targetType,
      includeImpersonated,
    });

    return c.json({ success: true as const, ...result });
  })

  /**
   * Delete all logs
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with success status
   * @throws {500} If an error occurs while deleting logs
   * @access protected
   * @permission log:delete
   */
  .delete("/", requirePermissionFactory("log:delete"), async (c) => {
    await deleteAllLogs();
    return c.json({ success: true as const });
  });
