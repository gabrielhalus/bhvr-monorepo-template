import type { PaginationParams } from "@/query/paginated/types";

import { api, ApiError } from "@/lib/http";

export async function fetchPaginatedUsers(params: PaginationParams) {
  const res = await api.users.$get({
    query: {
      page: String(params.page),
      limit: String(params.limit),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
    },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}

export async function fetchUser(userId: string) {
  const res = await api.users[":id{[a-zA-Z0-9_-]{21}}"].$get({
    param: { id: userId },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}
