import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { OAuthSignupTokensModel } from "~shared/models/oauth-signup-tokens.model";

export const OAuthSignupTokenSchema = createSelectSchema(OAuthSignupTokensModel);
export const InsertOAuthSignupTokenSchema = createInsertSchema(OAuthSignupTokensModel);
