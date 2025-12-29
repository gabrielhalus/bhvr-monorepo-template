import type { UserRelations } from "../types/users.types";

import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { arrayParam } from "../lib/helpers";
import { Users } from "../models/users.model";

/**
 * Schema for users
 */
export const UserSchema = createSelectSchema(Users);

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
 * Schema for inserting a new user
 */
export const InsertUserSchema = createInsertSchema(Users).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true }).extend({
  name: z
    .string()
    .min(3)
    .max(20),
  email: z
    .email()
    .transform(val => val.toLowerCase()),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/),
});

/**
 * Schema for updating a user
 */
export const UpdateUserSchema = createUpdateSchema(Users).extend({
  name: z
    .string()
    .min(3)
    .max(20),
  email: z
    .email()
    .transform(val => val?.toLowerCase()),
  password: z
    .never(),
}).partial();

/**
 * Schema for updating a user's password
 */
export const UpdateUserPasswordSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/),
});
