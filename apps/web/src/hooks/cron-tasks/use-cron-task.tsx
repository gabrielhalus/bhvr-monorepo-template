import { useQuery } from "@tanstack/react-query";

import { cronTaskQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";

export function useCronTask(taskId: string) {
  return useQuery(cronTaskQueryOptions(taskId));
}
