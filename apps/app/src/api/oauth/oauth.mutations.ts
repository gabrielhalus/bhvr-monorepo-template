import type { QueryClient } from "@tanstack/react-query";
import type { OAuthProviderId } from "~shared/types/db/oauth-accounts.types";

import { completePendingLink, unlinkAccount } from "./oauth.api";
import { oauthKeys } from "./oauth.keys";

// ============================================================================
// Mutation Options
// ============================================================================

export function unlinkAccountMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (provider: OAuthProviderId) => unlinkAccount(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oauthKeys.accounts });
    },
  };
}

export function completePendingLinkMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (data: { token: string; password: string }) => completePendingLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: oauthKeys.accounts });
    },
  };
}
