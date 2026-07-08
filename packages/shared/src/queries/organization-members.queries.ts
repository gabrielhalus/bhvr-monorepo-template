import type { Organization, OrganizationMember } from "../types/db/organizations.types";
import type { OrgId } from "../types/org.types";

import { and, eq } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { OrganizationMembersModel } from "../models/organization-members.model";
import { OrganizationsModel } from "../models/organizations.model";
import { OrganizationMemberSchema } from "../schemas/db/organization-members.schemas";
import { OrganizationSchema } from "../schemas/db/organizations.schemas";

/**
 * Get a membership record.
 * @param orgId - The organization id.
 * @param userId - The user id.
 * @returns The membership, or null if the user is not a member.
 */
export async function getMember(orgId: OrgId, userId: string): Promise<OrganizationMember | null> {
  const [member] = await drizzle
    .select()
    .from(OrganizationMembersModel)
    .where(and(
      eq(OrganizationMembersModel.organizationId, orgId),
      eq(OrganizationMembersModel.userId, userId),
    ))
    .limit(1);

  return member ? OrganizationMemberSchema.parse(member) : null;
}

/**
 * Add a user to an organization.
 * @param orgId - The organization id.
 * @param userId - The user id.
 * @param invitedById - The user who invited them, if any.
 * @returns The created membership.
 * @throws An error if the membership could not be created.
 */
export async function addMember(orgId: OrgId, userId: string, invitedById?: string): Promise<OrganizationMember> {
  const [member] = await drizzle
    .insert(OrganizationMembersModel)
    .values({ organizationId: orgId, userId, invitedById })
    .onConflictDoNothing()
    .returning();

  if (member) {
    return OrganizationMemberSchema.parse(member);
  }

  // Already a member — return the existing record
  const existing = await getMember(orgId, userId);
  if (!existing) {
    throw new Error("Failed to add organization member");
  }

  return existing;
}

/**
 * Remove a user from an organization. Their org role assignments are removed
 * by the caller (user-roles queries); the user account itself is never deleted.
 * @param orgId - The organization id.
 * @param userId - The user id.
 * @returns The removed membership.
 * @throws An error if the membership could not be removed.
 */
export async function removeMember(orgId: OrgId, userId: string): Promise<OrganizationMember> {
  const [removedMember] = await drizzle
    .delete(OrganizationMembersModel)
    .where(and(
      eq(OrganizationMembersModel.organizationId, orgId),
      eq(OrganizationMembersModel.userId, userId),
    ))
    .returning();

  if (!removedMember) {
    throw new Error("Failed to remove organization member");
  }

  return OrganizationMemberSchema.parse(removedMember);
}

/**
 * Get the organizations a user belongs to.
 * @param userId - The user id.
 * @returns The organizations.
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const rows = await drizzle
    .select({ organization: OrganizationsModel })
    .from(OrganizationMembersModel)
    .innerJoin(OrganizationsModel, eq(OrganizationMembersModel.organizationId, OrganizationsModel.id))
    .where(eq(OrganizationMembersModel.userId, userId))
    .orderBy(OrganizationsModel.createdAt);

  return rows.map(r => OrganizationSchema.parse(r.organization));
}
