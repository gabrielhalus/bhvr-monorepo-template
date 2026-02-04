import type { UserRelationKey } from "~shared/types/db/users.types";

import { queryOptions } from "@tanstack/react-query";

import { paginatedQueryOptions } from "~react/hooks/use-paginated-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchPaginatedUsers, fetchUser } from "./users.api";
import { usersKeys } from "./users.keys";
import { fetchUsersRelations } from "./users.relations.api";

export const paginatedUsersQueryOptions = paginatedQueryOptions({
  queryKey: usersKeys.paginated,
  queryFn: fetchPaginatedUsers,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export function userQueryOptions(userId: string) {
  return queryOptions({
    queryKey: usersKeys.byId(userId),
    queryFn: () => fetchUser(userId),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}

export function usersRelationsQueryOptions(userIds: string[], include: UserRelationKey[]) {
  return queryOptions({
    queryKey: usersKeys.relations(userIds, include),
    queryFn: () => fetchUsersRelations(userIds, include),
    enabled: userIds.length > 0,
    staleTime: QUERY_STALE_TIMES.RELATIONS,
  });
}
