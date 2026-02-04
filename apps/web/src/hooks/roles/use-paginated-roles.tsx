import { paginatedRolesQueryOptions } from "@/api/roles/roles.queries";
import { usePaginatedQuery } from "~react/hooks/use-paginated-query";

export function usePaginatedRoles() {
  return usePaginatedQuery({ ...paginatedRolesQueryOptions });
}
