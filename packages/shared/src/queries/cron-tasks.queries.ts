import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { z } from "zod";

import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { CronTaskRunsModel } from "../models/cron-task-runs.model";
import { CronTasksModel } from "../models/cron-tasks.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { CronTaskSchema, InsertCronTaskSchema, UpdateCronTaskSchema } from "../schemas/db/cron-tasks.schemas";

export type CronTask = z.infer<typeof CronTaskSchema>;
export type InsertCronTask = z.infer<typeof InsertCronTaskSchema>;
export type UpdateCronTask = z.infer<typeof UpdateCronTaskSchema>;

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get paginated cron tasks.
 * @param pagination - Pagination parameters.
 * @returns Paginated cron tasks.
 */
export async function getCronTasksPaginated(pagination: PaginationQuery): Promise<PaginatedResponse<CronTask>> {
  const { page, limit, sortBy, sortOrder, search } = pagination;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        ilike(CronTasksModel.name, `%${search}%`),
        ilike(CronTasksModel.handler, `%${search}%`),
      )
    : undefined;

  const sortableColumns: Record<string, typeof CronTasksModel.name | typeof CronTasksModel.createdAt | typeof CronTasksModel.lastRunAt | typeof CronTasksModel.nextRunAt> = {
    name: CronTasksModel.name,
    createdAt: CronTasksModel.createdAt,
    lastRunAt: CronTasksModel.lastRunAt,
    nextRunAt: CronTasksModel.nextRunAt,
  };

  const countQuery = drizzle.select({ count: count() }).from(CronTasksModel);
  if (searchCondition) {
    countQuery.where(searchCondition);
  }

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle.select().from(CronTasksModel);
  if (searchCondition) {
    dataQuery.where(searchCondition);
  }

  const sortColumn = sortBy && sortableColumns[sortBy] ? sortableColumns[sortBy] : CronTasksModel.createdAt;
  if (sortOrder === "asc") {
    dataQuery.orderBy(asc(sortColumn));
  } else {
    dataQuery.orderBy(desc(sortColumn));
  }

  dataQuery.limit(limit).offset(offset);

  const tasks = await dataQuery;
  const parsedTasks = tasks.map(t => CronTaskSchema.parse(t));

  return createPaginatedResponse(parsedTasks, total, page, limit);
}

/**
 * Get all enabled cron tasks.
 * @returns All enabled cron tasks.
 */
export async function getEnabledCronTasks(): Promise<CronTask[]> {
  const tasks = await drizzle
    .select()
    .from(CronTasksModel)
    .where(eq(CronTasksModel.isEnabled, true));

  return tasks.map(t => CronTaskSchema.parse(t));
}

/**
 * Get a cron task by id.
 * @param id - The task id.
 * @returns The cron task or null if not found.
 */
export async function getCronTask(id: string): Promise<CronTask | null> {
  const [task] = await drizzle
    .select()
    .from(CronTasksModel)
    .where(eq(CronTasksModel.id, id));

  return task ? CronTaskSchema.parse(task) : null;
}

/**
 * Create a new cron task.
 * @param data - The task data.
 * @returns The created task.
 */
export async function createCronTask(data: InsertCronTask): Promise<CronTask> {
  const [task] = await drizzle
    .insert(CronTasksModel)
    .values(InsertCronTaskSchema.parse(data))
    .returning();

  if (!task) {
    throw new Error("Failed to create cron task");
  }

  return CronTaskSchema.parse(task);
}

/**
 * Update a cron task.
 * @param id - The task id.
 * @param data - The task data to update.
 * @returns The updated task.
 */
export async function updateCronTask(id: string, data: UpdateCronTask): Promise<CronTask> {
  const [task] = await drizzle
    .update(CronTasksModel)
    .set({ ...UpdateCronTaskSchema.parse(data), updatedAt: new Date().toISOString() })
    .where(eq(CronTasksModel.id, id))
    .returning();

  if (!task) {
    throw new Error("Failed to update cron task");
  }

  return CronTaskSchema.parse(task);
}

/**
 * Delete a cron task.
 * @param id - The task id.
 * @returns The deleted task.
 */
export async function deleteCronTask(id: string): Promise<CronTask> {
  const [task] = await drizzle
    .delete(CronTasksModel)
    .where(eq(CronTasksModel.id, id))
    .returning();

  if (!task) {
    throw new Error("Failed to delete cron task");
  }

  return CronTaskSchema.parse(task);
}

/**
 * Toggle a cron task's enabled state.
 * @param id - The task id.
 * @param isEnabled - The new enabled state.
 * @returns The updated task.
 */
export async function toggleCronTask(id: string, isEnabled: boolean): Promise<CronTask> {
  const updates: Partial<typeof CronTasksModel.$inferInsert> = {
    isEnabled,
    updatedAt: new Date().toISOString(),
  };

  if (!isEnabled) {
    updates.nextRunAt = null;
  }

  const [task] = await drizzle
    .update(CronTasksModel)
    .set(updates)
    .where(eq(CronTasksModel.id, id))
    .returning();

  if (!task) {
    throw new Error("Failed to toggle cron task");
  }

  return CronTaskSchema.parse(task);
}

/**
 * Update run timestamps for a cron task after execution.
 * @param id - The task id.
 * @param lastRunAt - The last run timestamp.
 * @param nextRunAt - The next scheduled run timestamp.
 */
export async function setTaskRunTimestamps(id: string, lastRunAt: string, nextRunAt: string | null): Promise<void> {
  await drizzle
    .update(CronTasksModel)
    .set({ lastRunAt, nextRunAt, updatedAt: new Date().toISOString() })
    .where(eq(CronTasksModel.id, id));
}

// ============================================================================
// Stats
// ============================================================================

/**
 * Get aggregate stats for cron tasks.
 * @returns Stats object with total, active, success rate (7d), and runs today.
 */
export async function getCronTaskStats(): Promise<{
  total: number;
  active: number;
  successRateSevenDays: number;
  runsToday: number;
}> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [taskStats] = await drizzle
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${CronTasksModel.isEnabled} = true)`,
    })
    .from(CronTasksModel);

  const [runStats] = await drizzle
    .select({
      runsToday: sql<number>`count(*) filter (where ${CronTaskRunsModel.startedAt} >= ${todayStart})`,
      totalSevenDays: sql<number>`count(*) filter (where ${CronTaskRunsModel.startedAt} >= ${sevenDaysAgo} and ${CronTaskRunsModel.status} != 'running')`,
      successSevenDays: sql<number>`count(*) filter (where ${CronTaskRunsModel.startedAt} >= ${sevenDaysAgo} and ${CronTaskRunsModel.status} = 'success')`,
    })
    .from(CronTaskRunsModel);

  const total = taskStats?.total ?? 0;
  const active = Number(taskStats?.active ?? 0);
  const runsToday = Number(runStats?.runsToday ?? 0);
  const totalSevenDays = Number(runStats?.totalSevenDays ?? 0);
  const successSevenDays = Number(runStats?.successSevenDays ?? 0);
  const successRateSevenDays = totalSevenDays > 0 ? Math.round((successSevenDays / totalSevenDays) * 100) : 100;

  return { total, active, successRateSevenDays, runsToday };
}

/**
 * Get aggregate stats for a specific cron task's runs.
 * @param taskId - The task id.
 * @returns Per-task stats.
 */
export async function getCronTaskRunStats(taskId: string): Promise<{
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  lastRunAt: string | null;
}> {
  const [stats] = await drizzle
    .select({
      totalRuns: sql<number>`count(*) filter (where ${CronTaskRunsModel.status} != 'running')`,
      successRuns: sql<number>`count(*) filter (where ${CronTaskRunsModel.status} = 'success')`,
      avgDurationMs: sql<number>`coalesce(avg(${CronTaskRunsModel.durationMs}) filter (where ${CronTaskRunsModel.durationMs} is not null), 0)`,
    })
    .from(CronTaskRunsModel)
    .where(eq(CronTaskRunsModel.taskId, taskId));

  const [lastRun] = await drizzle
    .select({ startedAt: CronTaskRunsModel.startedAt })
    .from(CronTaskRunsModel)
    .where(and(eq(CronTaskRunsModel.taskId, taskId), sql`${CronTaskRunsModel.status} != 'running'`))
    .orderBy(desc(CronTaskRunsModel.startedAt))
    .limit(1);

  const totalRuns = Number(stats?.totalRuns ?? 0);
  const successRuns = Number(stats?.successRuns ?? 0);
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;
  const avgDurationMs = Math.round(Number(stats?.avgDurationMs ?? 0));

  return { totalRuns, successRate, avgDurationMs, lastRunAt: lastRun?.startedAt ?? null };
}
