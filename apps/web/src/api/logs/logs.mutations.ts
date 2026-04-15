import type { QueryClient } from "@tanstack/react-query";

import { api } from "~react/lib/http";

import { logsKeys } from "./logs.keys";

// ============================================================================
// Mutation Functions
// ============================================================================

async function clearLogs() {
  const res = await api["logs"].$delete();

  if (!res.ok) {
    throw new Error("Failed to clear logs");
  }

  return res.json();
}

// ============================================================================
// Mutation Options
// ============================================================================

export function clearLogsMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: () => clearLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsKeys.all });
    },
  };
}
