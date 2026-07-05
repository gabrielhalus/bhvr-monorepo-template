import type { InvitationRelationKey } from "~shared/types/db/invitations.types";

export const invitationsRootKey = ["invitations"] as const;

export const invitationsKeys = {
  all: invitationsRootKey,
  paginated: [...invitationsRootKey, "paginated"] as const,
  relations: (invitationIds: string[], include: InvitationRelationKey[]) => [...invitationsRootKey, "relations", { invitationIds, include }] as const,
  validate: (token: string) => [...invitationsRootKey, "validate", token] as const,
};
