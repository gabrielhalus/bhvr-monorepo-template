import type { QueryClient } from "@tanstack/react-query";

import { createUserApiKey, deleteUserApiKey } from "./api-keys.api";
import { apiKeysKeys } from "./api-keys.keys";

export function createUserApiKeyMutationOptions(queryClient: QueryClient, userId: string) {
  return {
    mutationFn: createUserApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.forUser(userId) });
    },
  };
}

export function deleteUserApiKeyMutationOptions(queryClient: QueryClient, userId: string) {
  return {
    mutationFn: ({ userId: uid, apiKeyId }: { userId: string; apiKeyId: string }) => deleteUserApiKey(uid, apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysKeys.forUser(userId) });
    },
  };
}
