import { CronPattern } from "croner";
import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { cronScheduler } from "@/services/cron-scheduler";
import { getCronTaskRecentRuns, getCronTaskRunsChart, getCronTaskRunsPaginated } from "~shared/queries/cron-task-runs.queries";
import {
  createCronTask,
  deleteCronTask,
  getCronTask,
  getCronTaskRunStats,
  getCronTasksPaginated,
  getCronTaskStats,
  toggleCronTask,
  updateCronTask,
} from "~shared/queries/cron-tasks.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";
import { InsertCronTaskSchema, UpdateCronTaskSchema } from "~shared/schemas/db/cron-tasks.schemas";

// Runtime-safe cron expression validation using croner's CronPattern
const CronExpressionRefine = (val: string) => {
  try {
    new CronPattern(val);
    return true;
  } catch {
    return false;
  }
};

const InsertCronTaskRouteSchema = InsertCronTaskSchema.superRefine((data, ctx) => {
  if (!CronExpressionRefine(data.cronExpression)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid cron expression", path: ["cronExpression"] });
  }
});

const UpdateCronTaskRouteSchema = UpdateCronTaskSchema.superRefine((data, ctx) => {
  if (data.cronExpression !== undefined && !CronExpressionRefine(data.cronExpression)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid cron expression", path: ["cronExpression"] });
  }
});

export const cronTasksRoutes = new Hono()
  .use(getSessionContext)

  /**
   * Get paginated cron tasks
   * @permission cronTask:list
   */
  .get("/", validationMiddleware("query", PaginationQuerySchema), requirePermissionFactory("cronTask:list"), async (c) => {
    const { page, limit, sortBy, sortOrder, search } = c.req.valid("query");
    const result = await getCronTasksPaginated({ page, limit, sortBy, sortOrder, search });
    return c.json({ success: true as const, ...result });
  })

  /**
   * Get aggregate cron task stats
   * NOTE: declared before /:id to prevent "stats" from matching as an id
   * @permission cronTask:list
   */
  .get("/stats", requirePermissionFactory("cronTask:list"), async (c) => {
    const stats = await getCronTaskStats();
    return c.json({ success: true as const, stats });
  })

  /**
   * Create a new cron task
   * @permission cronTask:create
   */
  .post("/", validationMiddleware("json", InsertCronTaskRouteSchema), requirePermissionFactory("cronTask:create"), async (c) => {
    const data = c.req.valid("json");
    const task = await createCronTask(data);
    cronScheduler.scheduleTask(task);
    return c.json({ success: true as const, task }, 201);
  })

  /**
   * Get a single cron task by id
   * @permission cronTask:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("cronTask:read"), async (c) => {
    const id = c.req.param("id");
    const task = await getCronTask(id);
    if (!task) return c.json({ success: false, error: "Not Found" }, 404);
    return c.json({ success: true as const, task });
  })

  /**
   * Update a cron task
   * @permission cronTask:update
   */
  .put("/:id{[a-zA-Z0-9-]{21}}", validationMiddleware("json", UpdateCronTaskRouteSchema), requirePermissionFactory("cronTask:update"), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const task = await updateCronTask(id, data);
    await cronScheduler.reload(id);
    return c.json({ success: true as const, task });
  })

  /**
   * Delete a cron task (also cascade-deletes all runs)
   * @permission cronTask:delete
   */
  .delete("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("cronTask:delete"), async (c) => {
    const id = c.req.param("id");
    const task = await deleteCronTask(id);
    cronScheduler.unscheduleTask(id);
    return c.json({ success: true as const, task });
  })

  /**
   * Toggle enable/disable state for a cron task
   * @permission cronTask:update
   */
  .patch("/:id{[a-zA-Z0-9-]{21}}/toggle", requirePermissionFactory("cronTask:update"), async (c) => {
    const id = c.req.param("id");
    const existing = await getCronTask(id);
    if (!existing) return c.json({ success: false, error: "Not Found" }, 404);
    const task = await toggleCronTask(id, !existing.isEnabled);
    await cronScheduler.reload(id);
    return c.json({ success: true as const, task });
  })

  /**
   * Manually trigger a cron task immediately
   * @permission cronTask:trigger
   */
  .post("/:id{[a-zA-Z0-9-]{21}}/trigger", requirePermissionFactory("cronTask:trigger"), async (c) => {
    const id = c.req.param("id");
    const run = await cronScheduler.triggerTask(id);
    return c.json({ success: true as const, run });
  })

  /**
   * Get paginated execution history for a cron task
   * @permission cronTask:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/runs", validationMiddleware("query", PaginationQuerySchema), requirePermissionFactory("cronTask:read"), async (c) => {
    const id = c.req.param("id");
    const { page, limit, sortBy, sortOrder, search } = c.req.valid("query");
    const result = await getCronTaskRunsPaginated(id, { page, limit, sortBy, sortOrder, search });
    return c.json({ success: true as const, ...result });
  })

  /**
   * Get the last 20 runs for timeline visualization
   * @permission cronTask:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/runs/recent", requirePermissionFactory("cronTask:read"), async (c) => {
    const id = c.req.param("id");
    const runs = await getCronTaskRecentRuns(id, 20);
    return c.json({ success: true as const, runs });
  })

  /**
   * Get chart data for runs over the last 30 days (grouped by day)
   * @permission cronTask:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/runs/chart", requirePermissionFactory("cronTask:read"), async (c) => {
    const id = c.req.param("id");
    const data = await getCronTaskRunsChart(id);
    return c.json({ success: true as const, data });
  })

  /**
   * Get per-task run stats (total, success rate, avg duration)
   * @permission cronTask:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/stats", requirePermissionFactory("cronTask:read"), async (c) => {
    const id = c.req.param("id");
    const stats = await getCronTaskRunStats(id);
    return c.json({ success: true as const, stats });
  });
