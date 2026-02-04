import type { PaginationParams } from "~react/query/paginated/types";

import { api } from "~react/lib/http";

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
    throw new Error("Failed to fetch invitations");
  }

  return res.json();
}

export async function validateInvitation(token: string) {
  const res = await api.invitations.validate.$get({ query: { token } });

  if (!res.ok) {
    throw new Error("Failed to validate invitation");
  }

  return res.json();
}
