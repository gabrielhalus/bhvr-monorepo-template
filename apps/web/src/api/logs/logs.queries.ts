import { paginatedQueryOptions } from "~react/hooks/use-paginated-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchPaginatedLogs } from "./logs.api";
import { logsKeys } from "./logs.keys";

export const paginatedLogsQueryOptions = paginatedQueryOptions({
  queryKey: logsKeys.paginated,
  queryFn: fetchPaginatedLogs,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});
