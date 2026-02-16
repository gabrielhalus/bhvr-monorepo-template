import { useQuery } from "@tanstack/react-query";

import { userSessionsQueryOptions } from "@/api/sessions/sessions.queries";

export function useUserSessions(userId: string) {
  return useQuery(userSessionsQueryOptions(userId));
}
