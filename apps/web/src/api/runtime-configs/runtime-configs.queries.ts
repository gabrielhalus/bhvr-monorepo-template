import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchRuntimeConfig, fetchRuntimeConfigs } from "./runtime-configs.api";
import { runtimeConfigsKeys } from "./runtime-configs.keys";

export const runtimeConfigsQueryOptions = queryOptions({
  queryKey: runtimeConfigsKeys.list,
  queryFn: fetchRuntimeConfigs,
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});

export function runtimeConfigQueryOptions(key: string) {
  return queryOptions({
    queryKey: runtimeConfigsKeys.byKey(key),
    queryFn: () => fetchRuntimeConfig(key),
    staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
  });
}
