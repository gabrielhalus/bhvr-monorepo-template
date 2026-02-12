import type { QueryClient } from "@tanstack/react-query";

import { api } from "~react/lib/http";

import { auditLogsKeys } from "./audit-logs.keys";

// ============================================================================
// Mutation Functions
// ============================================================================

async function clearAuditLogs() {
  const res = await api["audit-logs"].$delete();

  if (!res.ok) {
    throw new Error("Failed to clear audit logs");
  }

  return res.json();
}

// ============================================================================
// Mutation Options
// ============================================================================

export function clearAuditLogsMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: () => clearAuditLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
    },
  };
}
