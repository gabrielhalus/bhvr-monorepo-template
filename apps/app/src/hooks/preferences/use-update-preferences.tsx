import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updatePreferencesMutationOptions } from "@/api/preferences/preferences.mutations";

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updatePreferencesMutationOptions(queryClient),
  });
}
