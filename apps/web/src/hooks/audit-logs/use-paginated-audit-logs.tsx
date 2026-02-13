import type { AuditLogFilters } from "@/api/audit-logs/audit-logs.api";

import { fetchPaginatedAuditLogs } from "@/api/audit-logs/audit-logs.api";
import { auditLogsKeys } from "@/api/audit-logs/audit-logs.keys";
import { QUERY_STALE_TIMES } from "@/api/query-config";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function usePaginatedAuditLogs(filters: AuditLogFilters = {}) {
  return usePaginatedQuery({
    queryKey: [...auditLogsKeys.paginated, filters],
    queryFn: params => fetchPaginatedAuditLogs({ ...params, ...filters }),
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });
}
