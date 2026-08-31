import { useMutation, useQueryClient } from "@tanstack/react-query";

import { completePendingSignupMutationOptions } from "@/api/oauth/oauth.mutations";

export function useCompletePendingSignup() {
  const queryClient = useQueryClient();

  return useMutation(completePendingSignupMutationOptions(queryClient));
}
