import type { WithRelations } from "~shared/lib/type-utils";
import type { TokensModel } from "~shared/models/tokens.model";
import type { AccessTokenSchema, RefreshTokenSchema, VerificationTokenSchema } from "~shared/schemas/api/tokens.schemas";
import type { User } from "~shared/types/db/users.types";
import type z from "zod";

export type Token = typeof TokensModel.$inferSelect;

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
