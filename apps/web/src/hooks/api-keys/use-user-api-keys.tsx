import { useQuery } from "@tanstack/react-query";

import { userApiKeysQueryOptions } from "@/api/api-keys/api-keys.queries";

export function useUserApiKeys(userId: string) {
  return useQuery(userApiKeysQueryOptions(userId));
}
