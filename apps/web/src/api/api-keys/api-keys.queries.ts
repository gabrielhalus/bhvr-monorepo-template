import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchUserApiKeys } from "./api-keys.api";
import { apiKeysKeys } from "./api-keys.keys";

export function userApiKeysQueryOptions(userId: string) {
  return queryOptions({
    queryKey: apiKeysKeys.forUser(userId),
    queryFn: () => fetchUserApiKeys(userId),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}
