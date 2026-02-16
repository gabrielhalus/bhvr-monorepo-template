import type { QueryClient } from "@tanstack/react-query";

import { revokeAllMySessions, revokeAllUserSessions, revokeSession, revokeUserSession } from "./sessions.api";
import { sessionsKeys } from "./sessions.keys";

// ============================================================================
// Mutation Options
// ============================================================================

export function revokeSessionMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (tokenId: string) => revokeSession(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.mine });
    },
  };
}

export function revokeAllMySessionsMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: () => revokeAllMySessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.mine });
    },
  };
}

export function revokeUserSessionMutationOptions(queryClient: QueryClient, userId: string) {
  return {
    mutationFn: (tokenId: string) => revokeUserSession(userId, tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.forUser(userId) });
    },
  };
}

export function revokeAllUserSessionsMutationOptions(queryClient: QueryClient, userId: string) {
  return {
    mutationFn: () => revokeAllUserSessions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.forUser(userId) });
    },
  };
}
