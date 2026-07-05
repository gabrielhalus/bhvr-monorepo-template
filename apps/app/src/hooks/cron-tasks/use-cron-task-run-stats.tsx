import { useQuery } from "@tanstack/react-query";

import { cronTaskRunStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";

export function useCronTaskRunStats(taskId: string) {
  return useQuery(cronTaskRunStatsQueryOptions(taskId));
}
