import type { InsertOrganizationSchema } from "~shared/schemas/db/organizations.schemas";
import type { Organization } from "~shared/types/db/organizations.types";
import type { z } from "zod";

import { BASE_DOMAIN, invalidateOrgDomains } from "@/middlewares/org-context";
import { createOrganizationDomain, getOrganizationDomains } from "~shared/queries/organization-domains.queries";
import { createOrganization, deleteOrganization } from "~shared/queries/organizations.queries";
import { seedOrgRoles } from "~shared/role-templates";
import { asOrgId } from "~shared/types/org.types";

/**
 * Create an organization ready for use: the org row, its verified subdomain
 * ({slug}.BASE_DOMAIN, primary) and the template roles (owner/admin/member).
 * @param data - The organization to create.
 * @returns The created organization.
 */
export async function provisionOrganization(data: z.infer<typeof InsertOrganizationSchema>): Promise<Organization> {
  const organization = await createOrganization(data);
  const orgId = asOrgId(organization.id);

  await createOrganizationDomain({
    organizationId: organization.id,
    domain: `${organization.slug}.${BASE_DOMAIN}`,
    type: "subdomain",
    isPrimary: true,
    verifiedAt: new Date().toISOString(),
  });

  await seedOrgRoles(orgId);

  return organization;
}

/**
 * Delete an organization and drop its domains from the resolution cache.
 * Org-scoped rows follow via FK cascade; user accounts are global and remain.
 * @param organization - The organization to delete.
 */
export async function teardownOrganization(organization: Organization): Promise<void> {
  const orgId = asOrgId(organization.id);
  const domains = await getOrganizationDomains(orgId);

  await deleteOrganization(orgId);
  await invalidateOrgDomains(domains.map(d => d.domain));
}
