import type { InsertOrganizationSchema, UpdateOrganizationSchema } from "../schemas/db/organizations.schemas";
import type { Organization } from "../types/db/organizations.types";
import type { OrgId } from "../types/org.types";
import type { z } from "zod";

import { eq } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OrganizationsModel } from "../models/organizations.model";
import { OrganizationSchema } from "../schemas/db/organizations.schemas";

/**
 * Get an organization by id.
 * @param id - The organization id.
 * @returns The organization, or null if not found.
 */
export async function getOrganization(id: string): Promise<Organization | null> {
  const [organization] = await drizzle.select().from(OrganizationsModel).where(eq(OrganizationsModel.id, id)).limit(1);
  return organization ? OrganizationSchema.parse(organization) : null;
}

/**
 * Get an organization by slug.
 * @param slug - The organization slug.
 * @returns The organization, or null if not found.
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const [organization] = await drizzle.select().from(OrganizationsModel).where(eq(OrganizationsModel.slug, slug)).limit(1);
  return organization ? OrganizationSchema.parse(organization) : null;
}

/**
 * Get all organizations.
 * @returns The organizations.
 */
export async function getOrganizations(): Promise<Organization[]> {
  const organizations = await drizzle.select().from(OrganizationsModel).orderBy(OrganizationsModel.createdAt);
  return organizations.map(o => OrganizationSchema.parse(o));
}

/**
 * Create a new organization.
 * @param organization - The organization to create.
 * @returns The created organization.
 * @throws An error if the organization could not be created.
 */
export async function createOrganization(organization: z.infer<typeof InsertOrganizationSchema>): Promise<Organization> {
  const [createdOrganization] = await drizzle
    .insert(OrganizationsModel)
    .values(organization)
    .returning();

  if (!createdOrganization) {
    throw new Error("Failed to create organization");
  }

  return OrganizationSchema.parse(createdOrganization);
}

/**
 * Update an organization.
 * @param orgId - The organization id.
 * @param updates - The fields to update.
 * @returns The updated organization.
 * @throws An error if the organization could not be updated.
 */
export async function updateOrganization(orgId: OrgId, updates: z.infer<typeof UpdateOrganizationSchema>): Promise<Organization> {
  const [updatedOrganization] = await drizzle
    .update(OrganizationsModel)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(OrganizationsModel.id, orgId))
    .returning();

  if (!updatedOrganization) {
    throw new Error("Failed to update organization");
  }

  return OrganizationSchema.parse(updatedOrganization);
}

/**
 * Delete an organization. Org-scoped rows (roles, members, domains, configs,
 * translations, invitations, flag overrides) follow via FK cascade.
 * @param orgId - The organization id.
 * @returns The deleted organization.
 * @throws An error if the organization could not be deleted.
 */
export async function deleteOrganization(orgId: OrgId): Promise<Organization> {
  const [deletedOrganization] = await drizzle
    .delete(OrganizationsModel)
    .where(eq(OrganizationsModel.id, orgId))
    .returning();

  if (!deletedOrganization) {
    throw new Error("Failed to delete organization");
  }

  return OrganizationSchema.parse(deletedOrganization);
}
