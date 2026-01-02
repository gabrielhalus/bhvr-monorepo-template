import type { PasswordRules } from "@bunstack/shared/types/auth.types";

import { z } from "zod";

import { PermissionSchema } from "@bunstack/shared/schemas/api/permissions.schemas";

export const passwordRules: PasswordRules = {
  minLength: 8,
  minUppercase: 1,
  minLowercase: 1,
  minDigits: 1,
  minSpecialChars: 1,
};

export const passwordChecks = {
  minLength: (val: string) => val.length >= passwordRules.minLength,
  minUppercase: (val: string) => (val.match(/[A-Z]/g) || []).length >= passwordRules.minUppercase,
  minLowercase: (val: string) => (val.match(/[a-z]/g) || []).length >= passwordRules.minLowercase,
  minDigits: (val: string) => (val.match(/\d/g) || []).length >= passwordRules.minDigits,
  minSpecialChars: (val: string) =>
    (val.match(/[!@#$%^&*()\-=+[\]{};:'",.<>/?\\|`]/g) || []).length >= passwordRules.minSpecialChars,
};

export const PasswordSchema = z
  .string()
  .min(passwordRules.minLength, "minLengthErrorMessage")
  .refine(passwordChecks.minUppercase, "minUppercaseErrorMessage")
  .refine(passwordChecks.minLowercase, "minLowercaseErrorMessage")
  .refine(passwordChecks.minDigits, "minDigitsErrorMessage")
  .refine(passwordChecks.minSpecialChars, "minSpecialCharsErrorMessage");

export const RegisterSchema = z.object({
  name: z.string().min(1, "requiredErrorMessage").min(3, "minLengthErrorMessage").max(20, "maxLengthErrorMessage"),
  email: z.email("invalidErrorMessage").toLowerCase(),
  password: PasswordSchema,
});

export const LoginSchema = z.object({
  email: z.email("invalidErrorMessage").toLowerCase(),
  password: z.string().min(1, "requiredErrorMessage"),
});

export const isAuthorizedSchema = z.object({
  permission: PermissionSchema,
  resource: z.record(z.string(), z.unknown()).optional(),
});
