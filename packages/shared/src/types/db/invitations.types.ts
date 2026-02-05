import type { WithRelations } from "~shared/lib/type-utils";
import type { InvitationsModel } from "~shared/models/invitations.model";
import type { InvitationRelationsSchema } from "~shared/schemas/api/invitations.schemas";
import type { Role } from "~shared/types/db/roles.types";
import type { User } from "~shared/types/db/users.types";
import type { z } from "zod";

export type Invitation = typeof InvitationsModel.$inferSelect;

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationRelations = {
  invitedBy?: User;
  roles: Role[];
};

export type InvitationRelationKey = z.infer<typeof InvitationRelationsSchema>[number];

export type InvitationWithRelations<T extends InvitationRelationKey[]> = WithRelations<Invitation, InvitationRelations, T>;
