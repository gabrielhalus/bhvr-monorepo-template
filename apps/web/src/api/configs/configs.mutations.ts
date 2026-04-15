import type { QueryClient } from "@tanstack/react-query";

import { api } from "~react/lib/http";

import { rotateConfig } from "./configs.api";
import { configsKeys } from "./configs.keys";

// ============================================================================
// Mutation Functions
// ============================================================================

async function updateConfig(key: string, value: string | null) {
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

export function updateConfigMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ key, value }: { key: string; value: string | null }) =>
      updateConfig(key, value),
    onSuccess: (_data: unknown, variables: { key: string; value: string | null }) => {
      queryClient.invalidateQueries({ queryKey: configsKeys.byKey(variables.key) });
      queryClient.invalidateQueries({ queryKey: configsKeys.list });
    },
  };
}

export function rotateConfigMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (key: string) => rotateConfig(key),
    onSuccess: (_data: unknown, key: string) => {
      queryClient.invalidateQueries({ queryKey: configsKeys.byKey(key) });
      queryClient.invalidateQueries({ queryKey: configsKeys.list });
    },
  };
}
