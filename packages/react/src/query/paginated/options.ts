import type { UsePaginatedQueryOptions } from "./types";

export function paginatedQueryOptions<TData, TError = Error>({
  queryKey,
  queryFn,
  initialPage = 1,
  initialLimit = 10,
  searchDebounceMs = 300,
  staleTime = 1000 * 60 * 5,
  enabled = true,
}: UsePaginatedQueryOptions<TData, TError>): UsePaginatedQueryOptions<TData, TError> {
  return {
    queryKey,
    queryFn,
    initialPage,
    initialLimit,
    searchDebounceMs,
    staleTime,
    enabled,
  };
}
