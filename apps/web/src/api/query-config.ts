export const QUERY_STALE_TIMES = {
  AUTH: Infinity,
  PAGINATED_LIST: 5 * 60 * 1000,
  SINGLE_ITEM: 2 * 60 * 1000,
  RELATIONS: 3 * 60 * 1000,
  VALIDATION: 60 * 1000,
  RUNTIME_CONFIG: 10 * 60 * 1000,
} as const;

export const QUERY_GC_TIMES = {
  VALIDATION: 5 * 60 * 1000,
} as const;
