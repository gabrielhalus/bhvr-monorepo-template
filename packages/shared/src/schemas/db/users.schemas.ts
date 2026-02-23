import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { UsersModel } from "~shared/models/users.model";

/**
 * Schema for users
 */
export const UserSchema = createSelectSchema(UsersModel);

/**
 * Schema for inserting a new user
 */
export const InsertUserSchema = createInsertSchema(UsersModel).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true }).extend({
  firstName: z
    .string()
    .min(1)
    .max(50),
  lastName: z
    .string()
    .min(1)
    .max(50),
  email: z
    .email()
    .transform(val => val.toLowerCase()),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/),
  verifiedAt: z
    .string()
    .optional()
    .nullable(),
});

/**
 * Schema for updating a user
 */
export const UpdateUserSchema = createUpdateSchema(UsersModel).extend({
  firstName: z
    .string()
    .min(1)
    .max(50),
  lastName: z
    .string()
    .min(1)
    .max(50),
  email: z
    .email()
    .transform(val => val?.toLowerCase()),
  password: z
    .never(),
}).partial();
