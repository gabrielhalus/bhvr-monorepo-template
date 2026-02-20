import { cronTaskRunsPaginatedQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function useCronTaskRuns(taskId: string) {
  return usePaginatedQuery({ ...cronTaskRunsPaginatedQueryOptions(taskId) });
}
