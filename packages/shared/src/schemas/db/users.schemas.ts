import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { UsersModel } from "~shared/models/users.model";
import { RANGE_PRESETS } from "~shared/schemas/api/date-range.schemas";

const jsonOverride = z.unknown();

export const UserPreferencesSchema = z.object({
  sidebarOpen: z.boolean().optional(),
  navLayout: z.enum(["sidebar", "navbar"]).optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  locale: z.string().optional(),
  defaultOrderRange: z.enum(RANGE_PRESETS).optional(),
}).nullable();

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UserMetadataSchema = z.object({
  system: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
}).nullable();

export type UserMetadata = z.infer<typeof UserMetadataSchema>;

/**
 * Schema for users
 */
export const UserSchema = createSelectSchema(UsersModel, {
  firstName: z
    .string()
    .min(1)
    .transform(val => val[0]!.toUpperCase() + val.slice(1)),
  lastName: z
    .string()
    .min(1)
    .transform(val => val[0]!.toUpperCase() + val.slice(1)),
  preferences: UserPreferencesSchema,
  metadata: UserMetadataSchema,
});

/**
 * Schema for inserting a new user
 */
export const InsertUserSchema = createInsertSchema(UsersModel, {
  preferences: jsonOverride.optional(),
  metadata: jsonOverride.optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true }).extend({
  firstName: z
    .string()
    .min(1)
    .max(50)
    .transform(val => val.trim().toLowerCase()),
  lastName: z
    .string()
    .min(1)
    .max(50)
    .transform(val => val.trim().toLowerCase()),
  email: z
    .email()
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
    .optional(),
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
    .max(50)
    .transform(val => val.trim().toLowerCase()),
  lastName: z
    .string()
    .min(1)
    .max(50)
    .transform(val => val.trim().toLowerCase()),
  email: z
    .email()
    .transform(val => val.trim().toLowerCase()),
  password: z
    .never(),
}).partial();
