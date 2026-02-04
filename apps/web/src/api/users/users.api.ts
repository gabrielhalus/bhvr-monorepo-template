import type { PaginationParams } from "~react/query/paginated/types";

import { api } from "~react/lib/http";

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
    throw new Error("Failed to fetch users");
  }

  return res.json();
}

export async function fetchUser(userId: string) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].$get({
    param: { id: userId },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return res.json();
}
