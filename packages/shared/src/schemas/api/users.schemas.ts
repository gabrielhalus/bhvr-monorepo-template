import type { UserRelations } from "~shared/types/db/users.types";

import { z } from "zod";

import { arrayParam } from "~shared/helpers";

/**
 * User relation keys
 */
const UserRelationKey = ["roles", "tokens"] as const satisfies (keyof UserRelations)[];

/**
 * Schema for user relations
 */
export const UserRelationsSchema = z.array(z.enum(UserRelationKey));

/**
 * Schema for user relations query
 */
export const UserRelationsQuerySchema = z.object({
  userIds: arrayParam(z.string().length(21)).optional(),
  include: arrayParam(z.enum(UserRelationKey)),
});

/**
 * Schema for updating a user's password
 */
export const UpdateUserPasswordSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/),
});
