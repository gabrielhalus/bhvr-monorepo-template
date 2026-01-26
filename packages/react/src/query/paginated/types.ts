import type { SortingState } from "@tanstack/react-table";

import type { QueryKey } from "@tanstack/react-query";
import type { PaginatedResponse, PaginationMeta } from "~shared/schemas/api/pagination.schemas";

export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?:  "asc" | "desc";
  search?: string;
};

export type UsePaginatedQueryOptions<TData, TError = Error> = {
  queryKey: QueryKey;
  queryFn: (params: PaginationParams) => Promise<PaginatedResponse<TData>>;
  initialPage?: number;
  initialLimit?: number;
  searchDebounceMs?: number;
  staleTime?: number;
  enabled?: boolean;
};

export type UsePaginatedQueryResult<TData> = {
  data: TData[] | undefined;
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  paginationState: { pageIndex: number; pageSize: number };
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  pageCount: number;
  sortingState: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  refetch: () => void;
};
