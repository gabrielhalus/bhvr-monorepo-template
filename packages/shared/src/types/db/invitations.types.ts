import type { WithRelations } from "~shared/lib/type-utils";
import type { InvitationsModel } from "~shared/models/invitations.model";
import type { InvitationRelationsSchema } from "~shared/schemas/api/invitations.schemas";
import type { User } from "~shared/types/db/users.types";
import type { z } from "zod";

export type Invitation = typeof InvitationsModel.$inferSelect;

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationRelations = {
  invitedBy: User;
};

export type InvitationRelationKeys = z.infer<typeof InvitationRelationsSchema>;

export type InvitationWithRelations<T extends InvitationRelationKeys> = WithRelations<Invitation, InvitationRelations, T>;
