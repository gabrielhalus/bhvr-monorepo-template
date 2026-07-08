import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { OrganizationDomainsModel } from "~shared/models/organization-domains.model";

export const OrganizationDomainTypeSchema = z.enum(["subdomain", "custom"]);

/**
 * Hostname: lowercase labels separated by dots, no port, no scheme.
 */
export const DomainNameSchema = z.string().min(1).max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, "errors.organization.invalidDomain");

export const OrganizationDomainSchema = createSelectSchema(OrganizationDomainsModel).extend({
  type: OrganizationDomainTypeSchema,
});

export const InsertOrganizationDomainSchema = createInsertSchema(OrganizationDomainsModel).omit({ id: true, createdAt: true }).extend({
  type: OrganizationDomainTypeSchema,
});
