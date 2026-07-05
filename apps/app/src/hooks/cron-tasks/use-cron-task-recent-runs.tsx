import { useQuery } from "@tanstack/react-query";

import { cronTaskRecentRunsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";

export function useCronTaskRecentRuns(taskId: string) {
  return useQuery(cronTaskRecentRunsQueryOptions(taskId));
}
