import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { UsersModel } from "~shared/models/users.model";

const jsonOverride = z.unknown();

export const UserPreferencesSchema = z.object({
  sidebarOpen: z.boolean().optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  locale: z.string().optional(),
}).nullable();

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * Schema for users
 */
export const UserSchema = createSelectSchema(UsersModel, {
  preferences: UserPreferencesSchema,
  metadata: jsonOverride,
});

/**
 * Schema for inserting a new user
 */
export const InsertUserSchema = createInsertSchema(UsersModel, {
  preferences: jsonOverride,
  metadata: jsonOverride,
}).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true }).extend({
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
export const UpdateUserSchema = createUpdateSchema(UsersModel, {
  preferences: jsonOverride,
  metadata: jsonOverride,
}).extend({
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
