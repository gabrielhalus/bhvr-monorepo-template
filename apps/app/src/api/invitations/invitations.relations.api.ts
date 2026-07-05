import type { InvitationRelationKey } from "~shared/types/db/invitations.types";

import { api, ApiError } from "@/lib/http";

export async function fetchInvitationsRelations(invitationIds: string[], include: InvitationRelationKey[]) {
  const res = await api.invitations.relations.$get({
    query: {
      invitationIds,
      include,
    },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}
