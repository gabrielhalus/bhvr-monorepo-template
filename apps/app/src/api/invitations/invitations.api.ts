import type { PaginationParams } from "@/query/paginated/types";

import { api, ApiError } from "@/lib/http";

export async function fetchPaginatedInvitations(params: PaginationParams) {
  const res = await api.invitations.$get({
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

export async function validateInvitation(token: string) {
  const res = await api.invitations.validate.$get({ query: { token } });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}
