import type { InvitationRelations } from "~shared/types/db/invitations.types";

import { z } from "zod";

import { arrayParam } from "~shared/helpers";
import { PasswordSchema } from "~shared/schemas/api/auth.schemas";

/**
 * Invitation relation keys
 */
const invitationRelationKeys = ["invitedBy"] as const satisfies (keyof InvitationRelations)[];

/**
 * Schema for invitation relations
 */
export const InvitationRelationsSchema = z.array(z.enum(invitationRelationKeys));

/**
 * Schema for invitation relations query
 */
export const InvitationRelationsQuerySchema = z.object({
  includes: arrayParam(z.enum(invitationRelationKeys)).optional(),
});

/**
 * Schema for creating an invitation
 */
export const CreateInvitationSchema = z.object({
  email: z.email("invalidErrorMessage").toLowerCase(),
  roleId: z.number().int().positive().nullish(),
  autoValidateEmail: z.boolean().optional().default(false),
});

/**
 * Schema for accepting an invitation
 */
export const AcceptInvitationSchema = z.object({
  token: z.string().length(64),
  name: z.string().min(1, "requiredErrorMessage").min(3, "minLengthErrorMessage").max(20, "maxLengthErrorMessage"),
  password: PasswordSchema,
});
