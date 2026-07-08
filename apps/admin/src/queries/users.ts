import type { User } from "~shared/types/db/users.types";

import { queryOptions } from "@tanstack/react-query";

import { adminApi, ApiError } from "@/lib/http";
import { QUERY_STALE_TIMES } from "~app-core/index";

export type UsersPage = {
  data: User[];
  total: number;
  totalPages: number;
};

export function usersQueryOptions(page: number, search: string) {
  return queryOptions({
    queryKey: ["admin", "users", { page, search }],
    queryFn: async (): Promise<UsersPage> => {
      const res = await adminApi.admin.users.$get({
        query: { page: String(page), limit: "20", ...(search && { search }) },
      });
      if (!res.ok) throw await ApiError.fromResponse(res);
      const body = await res.json();
      return { data: body.data, total: body.pagination.total, totalPages: body.pagination.totalPages };
    },
    staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
  });
}
