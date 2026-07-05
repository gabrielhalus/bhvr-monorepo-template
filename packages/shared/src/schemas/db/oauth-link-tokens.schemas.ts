import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { OAuthLinkTokensModel } from "~shared/models/oauth-link-tokens.model";

export const OAuthLinkTokenSchema = createSelectSchema(OAuthLinkTokensModel);
export const InsertOAuthLinkTokenSchema = createInsertSchema(OAuthLinkTokensModel);
