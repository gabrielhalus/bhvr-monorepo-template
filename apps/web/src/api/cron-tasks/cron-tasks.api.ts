import type { PaginationParams } from "~react/query/paginated/types";
import type { InsertCronTask, UpdateCronTask } from "~shared/queries/cron-tasks.queries";

import { api } from "~react/lib/http";

const cronApi = api["cron-tasks"];

export async function fetchPaginatedCronTasks(params: PaginationParams) {
  const res = await cronApi.$get({
    query: {
      page: String(params.page),
      limit: String(params.limit),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch cron tasks");
  return res.json();
}

export async function fetchCronTaskStats() {
  const res = await cronApi.stats.$get();
  if (!res.ok) throw new Error("Failed to fetch cron task stats");
  return res.json();
}

export async function fetchCronTask(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].$get({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to fetch cron task");
  return res.json();
}

export async function createCronTaskRequest(data: InsertCronTask) {
  const res = await cronApi.$post({ json: data });
  if (!res.ok) throw new Error("Failed to create cron task");
  return res.json();
}

export async function updateCronTaskRequest(taskId: string, data: UpdateCronTask) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].$put({ param: { id: taskId }, json: data });
  if (!res.ok) throw new Error("Failed to update cron task");
  return res.json();
}

export async function deleteCronTaskRequest(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].$delete({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to delete cron task");
  return res.json();
}

export async function toggleCronTaskRequest(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].toggle.$patch({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to toggle cron task");
  return res.json();
}

export async function triggerCronTaskRequest(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].trigger.$post({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to trigger cron task");
  return res.json();
}

export async function fetchCronTaskRunsPaginated(taskId: string, params: PaginationParams) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].runs.$get({
    param: { id: taskId },
    query: {
      page: String(params.page),
      limit: String(params.limit),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch cron task runs");
  return res.json();
}

export async function fetchCronTaskRecentRuns(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].runs.recent.$get({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to fetch recent runs");
  return res.json();
}

export async function fetchCronTaskRunsChart(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].runs.chart.$get({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to fetch cron task runs chart data");
  return res.json();
}

export async function fetchCronTaskRunStats(taskId: string) {
  const res = await cronApi[":id{[a-zA-Z0-9-]{21}}"].stats.$get({ param: { id: taskId } });
  if (!res.ok) throw new Error("Failed to fetch cron task run stats");
  return res.json();
}
