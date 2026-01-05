import type { RoleRelationKeys } from "~shared/types/db/roles.types";

import { queryOptions } from "@tanstack/react-query";

import { api } from "~react/lib/http";

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

export function getRolesQueryOptions(includes?: RoleRelationKeys) {
  return queryOptions({
    queryKey: ["get-roles-paginated", includes],
    queryFn: async () => {
      const res = await api.roles.$get({ query: { includes } });

      if (!res.ok) {
        throw new Error("Failed to fetch roles");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function getRoleByNameQueryOptions(name: string, includes?: RoleRelationKeys) {
  return queryOptions({
    queryKey: ["get-role-by-name", name, includes],
    queryFn: async () => {
      const res = await api.roles[":name"].$get({ param: { name }, query: { includes } });

      if (!res.ok) {
        throw new Error("Failed to fetch role");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
