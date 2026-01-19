import { z } from "zod";

export const AccessTokenSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  ttyp: z.literal("access"),
  iss: z.string(),
  impersonatorId: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  ttyp: z.literal("refresh"),
  jti: z.string(),
  iss: z.string(),
});

export const VerificationTokenSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  ttyp: z.literal("verification"),
  jti: z.string(),
  iss: z.string(),
});
