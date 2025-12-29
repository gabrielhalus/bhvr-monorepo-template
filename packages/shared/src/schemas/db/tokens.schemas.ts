import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";

import { Tokens } from "../../models/tokens.model";

export const TokenSchema = createSelectSchema(Tokens);

export const InsertTokenSchema = createInsertSchema(Tokens);

export const UpdateTokenSchema = createUpdateSchema(Tokens);

