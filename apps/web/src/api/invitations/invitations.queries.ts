import type { InvitationRelationKey } from "~shared/types/db/invitations.types";

import { queryOptions } from "@tanstack/react-query";

import { paginatedQueryOptions } from "~react/hooks/use-paginated-query";

import { QUERY_GC_TIMES, QUERY_STALE_TIMES } from "../query-config";
import { fetchPaginatedInvitations, validateInvitation } from "./invitations.api";
import { invitationsKeys } from "./invitations.keys";
import { fetchInvitationsRelations } from "./invitations.relations.api";

export const paginatedInvitationsQueryOptions = paginatedQueryOptions({
  queryKey: invitationsKeys.paginated,
  queryFn: fetchPaginatedInvitations,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export function invitationsRelationsQueryOptions(invitationIds: string[], include: InvitationRelationKey[]) {
  return queryOptions({
    queryKey: invitationsKeys.relations(invitationIds, include),
    queryFn: () => fetchInvitationsRelations(invitationIds, include),
    enabled: invitationIds.length > 0,
    staleTime: QUERY_STALE_TIMES.RELATIONS,
  });
}

export function validateInvitationQueryOptions(token: string) {
  return queryOptions({
    queryKey: invitationsKeys.validate(token),
    queryFn: () => validateInvitation(token),
    staleTime: QUERY_STALE_TIMES.VALIDATION,
    gcTime: QUERY_GC_TIMES.VALIDATION,
    retry: false,
  });
}
