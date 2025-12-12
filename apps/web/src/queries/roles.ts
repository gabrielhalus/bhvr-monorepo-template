import type { PaginationInput } from "@bunstack/shared/contracts/pagination";

import { queryOptions } from "@tanstack/react-query";

import { api } from "@bunstack/react/lib/http";

export const getAllRolesQueryOptions = queryOptions({
  queryKey: ["get-all-roles"],
  queryFn: async () => {
    const res = await api.roles.$get({ query: {} });

    if (!res.ok) {
      throw new Error("Failed to fetch roles");
    }

    return res.json();
  },
  staleTime: 1000 * 60 * 5,
});

export function getRolesPaginatedQueryOptions(props: PaginationInput) {
  return queryOptions({
    queryKey: ["get-roles-paginated", props],
    queryFn: async () => {
      const params = {
        ...props,
        page: String(props.page),
        pageSize: String(props.pageSize),
      };

      const res = await api.roles.$get({ query: params });

      if (!res.ok) {
        throw new Error("Failed to fetch roles");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function getRoleByNameQueryOptions(name: string) {
  return queryOptions({
    queryKey: ["get-role-by-name", name],
    queryFn: async () => {
      const res = await api.roles[":name"].$get({ param: { name } });

      if (!res.ok) {
        throw new Error("Failed to fetch role");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
