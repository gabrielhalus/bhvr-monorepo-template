import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";

import { TokensModel } from "~shared/models/tokens.model";

export const TokenSchema = createSelectSchema(TokensModel);

export const InsertTokenSchema = createInsertSchema(TokensModel);

export const UpdateTokenSchema = createUpdateSchema(TokensModel);
