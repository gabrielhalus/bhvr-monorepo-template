import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { PasswordResetTokensModel } from "~shared/models/password-reset-tokens.model";

export const PasswordResetTokenSchema = createSelectSchema(PasswordResetTokensModel);
export const InsertPasswordResetTokenSchema = createInsertSchema(PasswordResetTokensModel);
