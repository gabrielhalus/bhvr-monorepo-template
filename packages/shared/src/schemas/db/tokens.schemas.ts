import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";

import { TokensModel } from "../../models/tokens.model";

export const TokenSchema = createSelectSchema(TokensModel);

export const InsertTokenSchema = createInsertSchema(TokensModel);

export const UpdateTokenSchema = createUpdateSchema(TokensModel);

