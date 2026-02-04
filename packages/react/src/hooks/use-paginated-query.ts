import type { SortingState } from "@tanstack/react-table";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedCallback } from "./use-debounced-callback";
import { PaginationParams, UsePaginatedQueryOptions, UsePaginatedQueryResult } from "~react/query/paginated/types";


export function paginatedQueryOptions<TData, TError = Error>({
  ...options
}: UsePaginatedQueryOptions<TData, TError>): UsePaginatedQueryOptions<TData, TError> {
  return options
}

export function usePaginatedQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  initialPage = 1,
  initialLimit = 10,
  searchDebounceMs = 300,
  staleTime = 1000 * 60 * 5,
  enabled = true,
}: UsePaginatedQueryOptions<TData, TError>): UsePaginatedQueryResult<TData> {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, searchDebounceMs);

  const queryParams: PaginationParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: debouncedSearch ?? undefined,
    }),
    [page, limit, sortBy, sortOrder, debouncedSearch],
  );

  const query = useQuery({
    queryKey: [...queryKey, queryParams],
    queryFn: () => queryFn(queryParams),
    staleTime,
    enabled,
  });

  const paginationState = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: limit,
    }),
    [page, limit],
  );

  const onPaginationChange = useCallback(
    (newPagination: { pageIndex: number; pageSize: number }) => {
      setPage(newPagination.pageIndex + 1);
      setLimit(newPagination.pageSize);
    },
    [],
  );

  const sortingState: SortingState = useMemo(
    () => (sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []),
    [sortBy, sortOrder],
  );

  const onSortingChange = useCallback((newSorting: SortingState) => {
    const firstSort = newSorting[0];
    if (!firstSort) {
      setSortBy(undefined);
      setSortOrder("desc");
    } else {
      setSortBy(firstSort.id);
      setSortOrder(firstSort.desc ? "desc" : "asc");
    }
    setPage(1);
  }, []);

  const onSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      updateDebouncedSearch(value);
    },
    [updateDebouncedSearch],
  );

  const pageCount = query.data?.pagination?.totalPages ?? 0;

  return {
    data: query.data?.data,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    paginationState,
    onPaginationChange,
    pageCount,
    sortingState,
    onSortingChange,
    searchValue: searchInput,
    onSearchChange,
    refetch: query.refetch,
  };
}
