import type { InvitationRelationKey } from "~shared/types/db/invitations.types";

import { api } from "~react/lib/http";

export async function fetchInvitationsRelations(invitationIds: string[], include: InvitationRelationKey[]) {
  const res = await api.invitations.relations.$get({
    query: {
      invitationIds,
      include,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch invitations relations");
  }

  return res.json();
}
