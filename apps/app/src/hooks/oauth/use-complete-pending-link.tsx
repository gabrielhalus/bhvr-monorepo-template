import { useMutation, useQueryClient } from "@tanstack/react-query";

import { completePendingLinkMutationOptions } from "@/api/oauth/oauth.mutations";

export function useCompletePendingLink() {
  const queryClient = useQueryClient();

  return useMutation(completePendingLinkMutationOptions(queryClient));
}
