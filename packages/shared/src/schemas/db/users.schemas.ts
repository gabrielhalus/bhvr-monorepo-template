import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { UsersModel } from "~shared/db/models/users.model";

/**
 * Schema for users
 */
export const UserSchema = createSelectSchema(UsersModel);

/**
 * Schema for inserting a new user
 */
export const InsertUserSchema = createInsertSchema(UsersModel).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true }).extend({
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
export const UpdateUserSchema = createUpdateSchema(UsersModel).extend({
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
