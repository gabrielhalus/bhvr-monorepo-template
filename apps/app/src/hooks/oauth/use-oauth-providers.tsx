import { useQuery } from "@tanstack/react-query";

import { oauthProvidersQueryOptions } from "@/api/oauth/oauth.queries";

export function useOAuthProviders() {
  return useQuery(oauthProvidersQueryOptions);
}
