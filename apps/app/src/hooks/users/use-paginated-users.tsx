import { paginatedUsersQueryOptions } from "@/api/users/users.queries";
import { usePaginatedQuery } from "@/hooks/use-paginated-query";

export function usePaginatedUsers() {
  return usePaginatedQuery({ ...paginatedUsersQueryOptions });
}
