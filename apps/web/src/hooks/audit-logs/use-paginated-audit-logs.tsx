import { paginatedAuditLogsQueryOptions } from "@/api/audit-logs/audit-logs.queries";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function usePaginatedAuditLogs() {
  return usePaginatedQuery({ ...paginatedAuditLogsQueryOptions });
}
