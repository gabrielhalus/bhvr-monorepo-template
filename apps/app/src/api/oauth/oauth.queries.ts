import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchLinkedAccounts, fetchOAuthProviders, fetchPendingLink } from "./oauth.api";
import { oauthKeys } from "./oauth.keys";

export const oauthProvidersQueryOptions = queryOptions({
  queryKey: oauthKeys.providers,
  queryFn: fetchOAuthProviders,
  staleTime: QUERY_STALE_TIMES.RUNTIME_CONFIG,
});

export const linkedAccountsQueryOptions = queryOptions({
  queryKey: oauthKeys.accounts,
  queryFn: fetchLinkedAccounts,
  staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
});

export function pendingLinkQueryOptions(token: string) {
  return queryOptions({
    queryKey: oauthKeys.pendingLink(token),
    queryFn: () => fetchPendingLink(token),
    staleTime: QUERY_STALE_TIMES.VALIDATION,
    retry: false,
  });
}
