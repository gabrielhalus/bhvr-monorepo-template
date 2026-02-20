import { queryOptions } from "@tanstack/react-query";

import { paginatedQueryOptions } from "~react/hooks/use-paginated-query";

import { QUERY_STALE_TIMES } from "../query-config";
import {
  fetchCronTask,
  fetchCronTaskRecentRuns,
  fetchCronTaskRunsPaginated,
  fetchCronTaskRunsChart,
  fetchCronTaskRunStats,
  fetchCronTaskStats,
  fetchPaginatedCronTasks,
} from "./cron-tasks.api";
import { cronTasksKeys } from "./cron-tasks.keys";

export const paginatedCronTasksQueryOptions = paginatedQueryOptions({
  queryKey: cronTasksKeys.paginated,
  queryFn: fetchPaginatedCronTasks,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export const cronTaskStatsQueryOptions = queryOptions({
  queryKey: cronTasksKeys.stats,
  queryFn: fetchCronTaskStats,
  staleTime: 30 * 1000,
  refetchInterval: 60 * 1000,
});

export function cronTaskQueryOptions(taskId: string) {
  return queryOptions({
    queryKey: cronTasksKeys.byId(taskId),
    queryFn: () => fetchCronTask(taskId),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}

export function cronTaskRunsPaginatedQueryOptions(taskId: string) {
  return paginatedQueryOptions({
    queryKey: cronTasksKeys.runsPaginated(taskId),
    queryFn: (params) => fetchCronTaskRunsPaginated(taskId, params),
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });
}

export function cronTaskRecentRunsQueryOptions(taskId: string) {
  return queryOptions({
    queryKey: cronTasksKeys.runsRecent(taskId),
    queryFn: () => fetchCronTaskRecentRuns(taskId),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function cronTaskRunsChartQueryOptions(taskId: string) {
  return queryOptions({
    queryKey: cronTasksKeys.runsChart(taskId),
    queryFn: () => fetchCronTaskRunsChart(taskId),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}

export function cronTaskRunStatsQueryOptions(taskId: string) {
  return queryOptions({
    queryKey: cronTasksKeys.runStats(taskId),
    queryFn: () => fetchCronTaskRunStats(taskId),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
