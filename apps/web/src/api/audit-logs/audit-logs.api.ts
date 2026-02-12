import type { PaginationParams } from "~react/query/paginated/types";

import { api } from "~react/lib/http";

export type AuditLogFilters = {
  actionCategory?: string;
  targetType?: string;
};

export type AuditLogsParams = PaginationParams & {
  action?: string;
  actionCategory?: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  includeImpersonated?: boolean;
};

export async function fetchPaginatedAuditLogs(params: AuditLogsParams) {
  const res = await api["audit-logs"].$get({
    query: {
      page: String(params.page),
      limit: String(params.limit),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      action: params.action,
      actionCategory: params.actionCategory,
      actorId: params.actorId,
      targetId: params.targetId,
      targetType: params.targetType,
      includeImpersonated: params.includeImpersonated ? "true" : undefined,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return res.json();
}
