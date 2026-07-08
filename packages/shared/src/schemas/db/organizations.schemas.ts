import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

import { OrganizationsModel } from "~shared/models/organizations.model";

/**
 * DNS label: lowercase alphanumeric and hyphens, no leading/trailing hyphen.
 */
export const OrganizationSlugSchema = z.string().min(1).max(63).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "errors.organization.invalidSlug");

export const OrganizationSchema = createSelectSchema(OrganizationsModel);

export const InsertOrganizationSchema = createInsertSchema(OrganizationsModel).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  slug: OrganizationSlugSchema,
});

export const UpdateOrganizationSchema = createUpdateSchema(OrganizationsModel).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  slug: OrganizationSlugSchema.optional(),
}).partial();
