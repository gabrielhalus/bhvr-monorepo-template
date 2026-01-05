import type { UserRelations } from "~shared/types/db/users.types";

import { z } from "zod";

import { arrayParam } from "~shared/helpers";

/**
 * User relation keys
 */
const userRelationKeys = ["roles", "tokens"] as const satisfies (keyof UserRelations)[];

/**
 * Schema for user relations
 */
export const UserRelationsSchema = z.array(z.enum(userRelationKeys));

/**
 * Schema for user relations query
 */
export const UserRelationsQuerySchema = z.object({
  includes: arrayParam(z.enum(userRelationKeys)).optional(),
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
