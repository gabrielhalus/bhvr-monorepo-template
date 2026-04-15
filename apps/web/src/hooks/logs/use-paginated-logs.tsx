import type { LogFilters } from "@/api/logs/logs.api";

import { fetchPaginatedLogs } from "@/api/logs/logs.api";
import { logsKeys } from "@/api/logs/logs.keys";
import { QUERY_STALE_TIMES } from "@/api/query-config";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function usePaginatedLogs(filters: LogFilters = {}) {
  return usePaginatedQuery({
    queryKey: [...logsKeys.paginated, filters],
    queryFn: params => fetchPaginatedLogs({ ...params, ...filters }),
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });
}
