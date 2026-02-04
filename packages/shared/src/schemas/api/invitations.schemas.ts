import type { InvitationRelations } from "~shared/types/db/invitations.types";

import { z } from "zod";

import { arrayParam } from "~shared/helpers";
import { PasswordSchema } from "~shared/schemas/api/auth.schemas";

/**
 * Invitation relation keys
 */
const InvitationRelationKey = ["invitedBy"] as const satisfies (keyof InvitationRelations)[];

/**
 * Schema for invitation relations
 */
export const InvitationRelationsSchema = z.array(z.enum(InvitationRelationKey));

/**
 * Schema for invitation relations query
 */
export const InvitationRelationsQuerySchema = z.object({
  invitationIds: arrayParam(z.string().length(21)).optional(),
  include: arrayParam(z.enum(InvitationRelationKey)),
});

/**
 * Schema for creating an invitation
 */
export const CreateInvitationSchema = z.object({
  email: z.string().toLowerCase().trim().pipe(z.email("invalidErrorMessage")),
  roleId: z.number().or(z.undefined()),
  autoValidateEmail: z.boolean(),
});

/**
 * Schema for accepting an invitation
 */
export const AcceptInvitationSchema = z.object({
  token: z.string().length(64),
  name: z.string().min(1, "requiredErrorMessage").min(3, "minLengthErrorMessage").max(20, "maxLengthErrorMessage"),
  password: PasswordSchema,
});

/**
 * Schema for validating and invitation
 */
export const ValidateInvitationSchema = z.object({
  token: z.string().length(64),
});
