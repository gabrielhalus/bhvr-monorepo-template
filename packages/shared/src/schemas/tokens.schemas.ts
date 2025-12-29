import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { Tokens } from "../models/tokens.model";

export const TokenSchema = createSelectSchema(Tokens);

export const InsertTokenSchema = createInsertSchema(Tokens);

export const UpdateTokenSchema = createUpdateSchema(Tokens);

export const AccessTokenSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  ttyp: z.literal("access"),
  iss: z.string(),
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
