import { useQuery } from "@tanstack/react-query";

import { mySessionsQueryOptions } from "@/api/sessions/sessions.queries";

export function useMySessions() {
  return useQuery(mySessionsQueryOptions);
}
