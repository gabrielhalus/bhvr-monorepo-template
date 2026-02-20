import { useQuery } from "@tanstack/react-query";

import { cronTaskRunsChartQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";

export function useCronTaskRunsChart(taskId: string) {
  return useQuery(cronTaskRunsChartQueryOptions(taskId));
}
