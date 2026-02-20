import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";

import { and, asc, count, desc, eq, lt, sql } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { CronTaskRunsModel } from "../models/cron-task-runs.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { CronTaskRunSchema } from "../schemas/db/cron-task-runs.schemas";

export type CronTaskRun = typeof CronTaskRunsModel.$inferSelect;

// ============================================================================
// Core Run Operations
// ============================================================================

/**
 * Create a new cron task run with "running" status.
 * @param taskId - The task id.
 * @returns The created run.
 */
export async function createCronTaskRun(taskId: string): Promise<CronTaskRun> {
  const [run] = await drizzle
    .insert(CronTaskRunsModel)
    .values({ taskId, status: "running" })
    .returning();

  if (!run) throw new Error("Failed to create cron task run");

  return CronTaskRunSchema.parse(run);
}

/**
 * Complete a cron task run by updating its status, output, and duration.
 * @param runId - The run id.
 * @param status - The final status.
 * @param output - Optional output string.
 * @param error - Optional error message.
 * @returns The updated run.
 */
export async function completeCronTaskRun(
  runId: string,
  status: "success" | "error",
  output?: string,
  error?: string,
): Promise<CronTaskRun> {
  const completedAt = new Date().toISOString();

  const [run] = await drizzle
    .select()
    .from(CronTaskRunsModel)
    .where(eq(CronTaskRunsModel.id, runId));

  const durationMs = run?.startedAt
    ? Math.max(0, new Date(completedAt).getTime() - new Date(run.startedAt).getTime())
    : undefined;

  const [updatedRun] = await drizzle
    .update(CronTaskRunsModel)
    .set({ status, completedAt, durationMs, output, error })
    .where(eq(CronTaskRunsModel.id, runId))
    .returning();

  if (!updatedRun) throw new Error("Failed to complete cron task run");

  return CronTaskRunSchema.parse(updatedRun);
}

/**
 * Get paginated runs for a specific cron task.
 * @param taskId - The task id.
 * @param pagination - Pagination parameters.
 * @returns Paginated runs.
 */
export async function getCronTaskRunsPaginated(
  taskId: string,
  pagination: PaginationQuery,
): Promise<PaginatedResponse<CronTaskRun>> {
  const { page, limit, sortOrder } = pagination;
  const offset = (page - 1) * limit;

  const [countResult] = await drizzle
    .select({ count: count() })
    .from(CronTaskRunsModel)
    .where(eq(CronTaskRunsModel.taskId, taskId));

  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(CronTaskRunsModel)
    .where(eq(CronTaskRunsModel.taskId, taskId));

  if (sortOrder === "asc") {
    dataQuery.orderBy(asc(CronTaskRunsModel.startedAt));
  } else {
    dataQuery.orderBy(desc(CronTaskRunsModel.startedAt));
  }

  dataQuery.limit(limit).offset(offset);

  const runs = await dataQuery;
  const parsedRuns = runs.map(r => CronTaskRunSchema.parse(r));

  return createPaginatedResponse(parsedRuns, total, page, limit);
}

/**
 * Get the last N runs for a task (used for the timeline visualization).
 * @param taskId - The task id.
 * @param limit - Number of runs to fetch (default 20).
 * @returns Recent runs ordered oldest to newest.
 */
export async function getCronTaskRecentRuns(taskId: string, limit = 20): Promise<CronTaskRun[]> {
  const runs = await drizzle
    .select()
    .from(CronTaskRunsModel)
    .where(eq(CronTaskRunsModel.taskId, taskId))
    .orderBy(desc(CronTaskRunsModel.startedAt))
    .limit(limit);

  return runs.map(r => CronTaskRunSchema.parse(r)).reverse();
}

/**
 * Get chart data for a task's runs grouped by day (last 30 days).
 * @param taskId - The task id.
 * @returns Array of { date, success, error } per day.
 */
export async function getCronTaskRunsChart(taskId: string): Promise<{ date: string; success: number; error: number }[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const rows = await drizzle
    .select({
      date: sql<string>`date_trunc('day', ${CronTaskRunsModel.startedAt})::date::text`,
      success: sql<number>`count(*) filter (where ${CronTaskRunsModel.status} = 'success')`,
      error: sql<number>`count(*) filter (where ${CronTaskRunsModel.status} = 'error')`,
    })
    .from(CronTaskRunsModel)
    .where(
      and(
        eq(CronTaskRunsModel.taskId, taskId),
        sql`${CronTaskRunsModel.startedAt} >= ${thirtyDaysAgo}`,
        sql`${CronTaskRunsModel.status} != 'running'`,
      ),
    )
    .groupBy(sql`date_trunc('day', ${CronTaskRunsModel.startedAt})::date`)
    .orderBy(asc(sql`date_trunc('day', ${CronTaskRunsModel.startedAt})::date`));

  return rows.map(r => ({
    date: r.date,
    success: Number(r.success),
    error: Number(r.error),
  }));
}

/**
 * Mark all stalled "running" runs (older than 1 hour) as failed.
 * Called on scheduler startup to clean up after a crash.
 */
export async function markStalledRunsAsFailed(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  await drizzle
    .update(CronTaskRunsModel)
    .set({
      status: "error",
      completedAt: new Date().toISOString(),
      error: "Task interrupted (server restart)",
    })
    .where(
      and(
        eq(CronTaskRunsModel.status, "running"),
        lt(CronTaskRunsModel.startedAt, oneHourAgo),
      ),
    );
}
