import { queryOptions } from "@tanstack/react-query";

import { QUERY_STALE_TIMES } from "../query-config";
import { fetchMySessions, fetchUserSessions } from "./sessions.api";
import { sessionsKeys } from "./sessions.keys";

export const mySessionsQueryOptions = queryOptions({
  queryKey: sessionsKeys.mine,
  queryFn: fetchMySessions,
  staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
});

export function userSessionsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: sessionsKeys.forUser(userId),
    queryFn: () => fetchUserSessions(userId),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}
