import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { OAuthAccountsModel } from "~shared/models/oauth-accounts.model";

export const OAuthAccountSchema = createSelectSchema(OAuthAccountsModel);
export const InsertOAuthAccountSchema = createInsertSchema(OAuthAccountsModel);
