import type { QueryClient } from "@tanstack/react-query";

import { api } from "~react/lib/http";

import { runtimeConfigsKeys } from "./runtime-configs.keys";

// ============================================================================
// Mutation Functions
// ============================================================================

async function updateRuntimeConfig(key: string, value: string | null) {
  const res = await api.config[":key"].$put({
    param: { key },
    json: { value },
  });

  if (!res.ok) {
    throw new Error(`Failed to update configuration "${key}"`);
  }

  return res.json();
}

// ============================================================================
// Mutation Options
// ============================================================================

export function updateRuntimeConfigMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ key, value }: { key: string; value: string | null }) =>
      updateRuntimeConfig(key, value),
    onSuccess: (_data: unknown, variables: { key: string; value: string | null }) => {
      queryClient.invalidateQueries({ queryKey: runtimeConfigsKeys.byKey(variables.key) });
      queryClient.invalidateQueries({ queryKey: runtimeConfigsKeys.list });
    },
  };
}
