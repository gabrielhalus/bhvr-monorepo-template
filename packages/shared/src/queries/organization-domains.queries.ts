import type { InsertOrganizationDomainSchema } from "../schemas/db/organization-domains.schemas";
import type { OrganizationDomain } from "../types/db/organizations.types";
import type { OrgId } from "../types/org.types";
import type { z } from "zod";

import { and, eq, isNotNull } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OrganizationDomainsModel } from "../models/organization-domains.model";
import { OrganizationDomainSchema } from "../schemas/db/organization-domains.schemas";

/**
 * Resolve a hostname to its organization id. Only verified domains resolve —
 * an unverified custom domain must never route traffic to an organization.
 * @param domain - The hostname (lowercase, without port).
 * @returns The organization id, or null if the domain is unknown or unverified.
 */
export async function getOrganizationIdByDomain(domain: string): Promise<string | null> {
  const [row] = await drizzle
    .select({ organizationId: OrganizationDomainsModel.organizationId })
    .from(OrganizationDomainsModel)
    .where(and(
      eq(OrganizationDomainsModel.domain, domain),
      isNotNull(OrganizationDomainsModel.verifiedAt),
    ))
    .limit(1);

  return row?.organizationId ?? null;
}

/**
 * Get all domains of an organization.
 * @param orgId - The organization id.
 * @returns The domains.
 */
export async function getOrganizationDomains(orgId: OrgId): Promise<OrganizationDomain[]> {
  const domains = await drizzle
    .select()
    .from(OrganizationDomainsModel)
    .where(eq(OrganizationDomainsModel.organizationId, orgId))
    .orderBy(OrganizationDomainsModel.createdAt);

  return domains.map(d => OrganizationDomainSchema.parse(d));
}

/**
 * Create a domain for an organization.
 * @param domain - The domain to create.
 * @returns The created domain.
 * @throws An error if the domain could not be created.
 */
export async function createOrganizationDomain(domain: z.infer<typeof InsertOrganizationDomainSchema>): Promise<OrganizationDomain> {
  const [createdDomain] = await drizzle
    .insert(OrganizationDomainsModel)
    .values({ ...domain, domain: domain.domain.toLowerCase() })
    .returning();

  if (!createdDomain) {
    throw new Error("Failed to create organization domain");
  }

  return OrganizationDomainSchema.parse(createdDomain);
}

/**
 * Mark a domain of an organization as verified.
 * @param orgId - The organization id.
 * @param id - The domain id.
 * @returns The verified domain.
 * @throws An error if the domain could not be updated.
 */
export async function verifyOrganizationDomain(orgId: OrgId, id: number): Promise<OrganizationDomain> {
  const [verifiedDomain] = await drizzle
    .update(OrganizationDomainsModel)
    .set({ verifiedAt: new Date().toISOString(), verificationToken: null })
    .where(and(
      eq(OrganizationDomainsModel.organizationId, orgId),
      eq(OrganizationDomainsModel.id, id),
    ))
    .returning();

  if (!verifiedDomain) {
    throw new Error("Failed to verify organization domain");
  }

  return OrganizationDomainSchema.parse(verifiedDomain);
}

/**
 * Delete a domain of an organization.
 * @param orgId - The organization id.
 * @param id - The domain id.
 * @returns The deleted domain.
 * @throws An error if the domain could not be deleted.
 */
export async function deleteOrganizationDomain(orgId: OrgId, id: number): Promise<OrganizationDomain> {
  const [deletedDomain] = await drizzle
    .delete(OrganizationDomainsModel)
    .where(and(
      eq(OrganizationDomainsModel.organizationId, orgId),
      eq(OrganizationDomainsModel.id, id),
    ))
    .returning();

  if (!deletedDomain) {
    throw new Error("Failed to delete organization domain");
  }

  return OrganizationDomainSchema.parse(deletedDomain);
}
