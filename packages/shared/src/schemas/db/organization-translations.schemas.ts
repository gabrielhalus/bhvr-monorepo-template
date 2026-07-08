import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { OrganizationTranslationsModel } from "~shared/models/organization-translations.model";

export const OrganizationTranslationSchema = createSelectSchema(OrganizationTranslationsModel);

export const InsertOrganizationTranslationSchema = createInsertSchema(OrganizationTranslationsModel).omit({ updatedAt: true });
