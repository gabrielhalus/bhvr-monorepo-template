import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchConfig, fetchConfigs } from "./configs.api";
import { configsKeys } from "./configs.keys";

export const configsQueryOptions = queryOptions({
  queryKey: configsKeys.list,
  queryFn: fetchConfigs,
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});

export function configQueryOptions(key: string) {
  return queryOptions({
    queryKey: configsKeys.byKey(key),
    queryFn: () => fetchConfig(key),
    staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
  });
}
