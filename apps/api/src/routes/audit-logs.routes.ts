import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { auditList } from "@/middlewares/audit";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteAllAuditLogs, getAuditLogsPaginated } from "~shared/queries/audit-logs.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";

const AuditLogsQuerySchema = PaginationQuerySchema.extend({
  action: z.string().optional(),
  actionCategory: z.string().optional(),
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  includeImpersonated: z.coerce.boolean().optional().default(false),
});

export const auditLogsRoutes = new Hono()
  // --- All routes require authentication
  .use(getSessionContext)

  /**
   * Get paginated audit logs
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated audit logs
   * @throws {500} If an error occurs while retrieving audit logs
   * @access protected
   * @permission auditLog:list
   */
  .get("/", validationMiddleware("query", AuditLogsQuerySchema), requirePermissionFactory("auditLog:list"), auditList("auditLog:list", "auditLog"), async (c) => {
    const { page, limit, sortBy, sortOrder, search, action, actionCategory, actorId, targetId, targetType, includeImpersonated } = c.req.valid("query");

    try {
      const result = await getAuditLogsPaginated({
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
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Delete all audit logs
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with success status
   * @throws {500} If an error occurs while deleting audit logs
   * @access protected
   * @permission auditLog:delete
   */
  .delete("/", requirePermissionFactory("auditLog:delete"), async (c) => {
    try {
      await deleteAllAuditLogs();
      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
