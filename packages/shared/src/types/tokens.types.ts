import type { Tokens } from "../models/tokens.model";
import type { User } from "./users.types";
import type { WithRelations } from "@/lib/type-utils";
import type { AccessTokenSchema, RefreshTokenSchema, VerificationTokenSchema } from "@/schemas/tokens.schemas";
import type z from "zod";

export type Token = typeof Tokens.$inferSelect;

export type TokenRelations = {
  user: User;
};

export type TokenWithRelations<T extends (keyof TokenRelations)[]> = WithRelations<Token, TokenRelations, T>;

// The payload of an access token.
export type AccessToken = z.infer<typeof AccessTokenSchema>;

// The payload of a refresh token.
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

// The payload of a verification token.
export type VerificationToken = z.infer<typeof VerificationTokenSchema>;

export type JwtPayload
  = | AccessToken
    | RefreshToken
    | VerificationToken;
