import { useQuery } from "@tanstack/react-query";

import { cronTaskStatsQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";

export function useCronTaskStats() {
  return useQuery(cronTaskStatsQueryOptions);
}
