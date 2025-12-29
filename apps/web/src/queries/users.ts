import type { UserRelationKeys } from "@bunstack/shared/types/users.types";

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

export function getUsersQueryOptions(includes?: UserRelationKeys) {
  return queryOptions({
    queryKey: ["get-users", includes],
    queryFn: async () => {
      const res = await api.users.$get({ query: { includes } });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function getUserQueryOptions(id: string, includes?: UserRelationKeys) {
  return queryOptions({
    queryKey: ["get-user", id, includes],
    queryFn: async () => {
      const res = await api.users[":id"].$get({ param: { id }, query: { includes } });

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
