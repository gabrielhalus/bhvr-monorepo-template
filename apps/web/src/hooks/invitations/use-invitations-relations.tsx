import type { InvitationRelationKey } from "~shared/types/db/invitations.types";

import { useQuery } from "@tanstack/react-query";

import { invitationsRelationsQueryOptions } from "@/api/invitations/invitations.queries";

export function useInvitationsRelations(invitationIds: string[], include: InvitationRelationKey[]) {
  return useQuery({ ...invitationsRelationsQueryOptions(invitationIds, include) });
}
