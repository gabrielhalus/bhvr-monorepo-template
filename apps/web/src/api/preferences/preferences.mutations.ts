import type { QueryClient } from "@tanstack/react-query";
import type { UpdatePreferencesSchema } from "~shared/schemas/api/auth.schemas";
import type { z } from "zod";

import { authQueryOptions } from "~react/queries/auth";

import { updatePreferences } from "./preferences.api";

type UpdatePreferencesData = z.infer<typeof UpdatePreferencesSchema>;

export function updatePreferencesMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (data: UpdatePreferencesData) => updatePreferences(data),
    onSuccess: () => {
      queryClient.refetchQueries(authQueryOptions);
    },
  };
}
