import { paginatedQueryOptions } from "~react/hooks/use-paginated-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchPaginatedAuditLogs } from "./audit-logs.api";
import { auditLogsKeys } from "./audit-logs.keys";

export const paginatedAuditLogsQueryOptions = paginatedQueryOptions({
  queryKey: auditLogsKeys.paginated,
  queryFn: fetchPaginatedAuditLogs,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});
