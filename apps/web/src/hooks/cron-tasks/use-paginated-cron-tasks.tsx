import { paginatedCronTasksQueryOptions } from "@/api/cron-tasks/cron-tasks.queries";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function usePaginatedCronTasks() {
  return usePaginatedQuery({ ...paginatedCronTasksQueryOptions });
}
