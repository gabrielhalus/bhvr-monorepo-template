import type { Log } from "~shared/types/db/logs.types";

import { queryOptions } from "@tanstack/react-query";

import { adminApi, ApiError } from "@/lib/http";
import { QUERY_STALE_TIMES } from "~app-core/index";

export type LogsPage = {
  data: Log[];
  total: number;
  totalPages: number;
};

export function logsQueryOptions(page: number, options: { limit?: number } = {}) {
  const limit = options.limit ?? 30;

  return queryOptions({
    queryKey: ["admin", "logs", { page, limit }],
    queryFn: async (): Promise<LogsPage> => {
      const res = await adminApi.admin.logs.$get({ query: { page: String(page), limit: String(limit) } });
      if (!res.ok) throw await ApiError.fromResponse(res);
      const body = await res.json();
      return { data: body.data, total: body.pagination.total, totalPages: body.pagination.totalPages };
    },
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });
}
