import type { PaginationInput } from "@bunstack/shared/contracts/pagination";

import { queryOptions } from "@tanstack/react-query";

import { api } from "@bunstack/react/lib/http";

export const getAllUsersQueryOptions = queryOptions({
  queryKey: ["get-all-users"],
  queryFn: async () => {
    const res = await api.users.$get({ query: {} });

    if (!res.ok) {
      throw new Error("Failed to fetch users");
    }

    return res.json();
  },
  staleTime: 1000 * 60 * 5,
});

export function getUsersPaginatedQueryOptions(props: PaginationInput) {
  return queryOptions({
    queryKey: ["get-users-paginated", props],
    queryFn: async () => {
      const params = {
        ...props,
        page: String(props.page),
        pageSize: String(props.pageSize),
      };

      const res = await api.users.$get({ query: params });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function getUserQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["get-user", id],
    queryFn: async () => {
      const res = await api.users[":id"].$get({ param: { id } });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
