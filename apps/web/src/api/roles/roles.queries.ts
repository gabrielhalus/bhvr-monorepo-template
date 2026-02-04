import type { RoleRelationKeys } from "~shared/types/db/roles.types";

import { queryOptions } from "@tanstack/react-query";

import { paginatedQueryOptions } from "~react/hooks/use-paginated-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchAllRoles, fetchPaginatedRoles, fetchRole, fetchRolesRelations } from "./roles.api";
import { rolesKeys } from "./roles.keys";

export const paginatedRolesQueryOptions = paginatedQueryOptions({
  queryKey: rolesKeys.paginated,
  queryFn: fetchPaginatedRoles,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export const allRolesQueryOptions = queryOptions({
  queryKey: rolesKeys.list,
  queryFn: fetchAllRoles,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export function roleQueryOptions(roleName: string) {
  return queryOptions({
    queryKey: rolesKeys.byName(roleName),
    queryFn: () => fetchRole(roleName),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}

export function rolesRelationsQueryOptions(roleIds: number[], include: RoleRelationKeys) {
  return queryOptions({
    queryKey: rolesKeys.relations(roleIds, include),
    queryFn: () => fetchRolesRelations(roleIds, include),
    enabled: roleIds.length > 0,
    staleTime: QUERY_STALE_TIMES.RELATIONS,
  });
}
