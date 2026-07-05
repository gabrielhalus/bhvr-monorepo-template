import { useQuery } from "@tanstack/react-query";

import { linkedAccountsQueryOptions } from "@/api/oauth/oauth.queries";

export function useLinkedAccounts() {
  return useQuery(linkedAccountsQueryOptions);
}
