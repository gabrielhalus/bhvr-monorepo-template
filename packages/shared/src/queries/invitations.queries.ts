import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { Invitation, InvitationRelationKey, InvitationRelations, InvitationWithRelations } from "../types/db/invitations.types";
import type { z } from "zod";

import { and, asc, count, desc, eq, ilike, inArray, lt, or } from "drizzle-orm";

import { RoleSchema } from "~shared/schemas/db/roles.schemas";
import { UserSchema } from "~shared/schemas/db/users.schemas";

import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { InvitationRolesModel } from "../models/invitation-roles.model";
import { InvitationsModel } from "../models/invitations.model";
import { RolesModel } from "../models/roles.model";
import { UsersModel } from "../models/users.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { InsertInvitationSchema, InvitationSchema, UpdateInvitationSchema } from "../schemas/db/invitations.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

export const invitationRelationLoaders: { [K in keyof InvitationRelations]: (invitationIds: string[]) => Promise<Record<string, InvitationRelations[K]>> } = {
  invitedBy: async (invitationIds) => {
    const result: Record<string, InvitationRelations["invitedBy"]> = {};

    if (!invitationIds?.length) {
      return result;
    }

    const invitationsRows = await drizzle
      .select({
        invitationId: InvitationsModel.id,
        user: UsersModel,
      })
      .from(InvitationsModel)
      .innerJoin(UsersModel, eq(InvitationsModel.invitedById, UsersModel.id))
      .where(inArray(InvitationsModel.id, invitationIds));

    for (const row of invitationsRows) {
      if (row.user) {
        result[row.invitationId]! = UserSchema.parse(row.user);
      }
    }

    return result;
  },

  roles: async (invitationIds) => {
    const result: Record<string, InvitationRelations["roles"]> = {};

    if (!invitationIds?.length) {
      return result;
    }

    invitationIds.forEach(id => (result[id] = []));

    const rolesRows = await drizzle
      .select({
        invitationId: InvitationRolesModel.invitationId,
        role: RolesModel,
      })
      .from(InvitationRolesModel)
      .innerJoin(RolesModel, eq(InvitationRolesModel.roleId, RolesModel.id))
      .where(inArray(InvitationRolesModel.invitationId, invitationIds));

    for (const row of rolesRows) {
      if (row.role) {
        result[row.invitationId]!.push(RoleSchema.parse(row.role));
      }
    }

    return result;
  },
};

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all invitations with optional relations.
 * @param includes - The relations to include.
 * @returns The invitations with relations.
 */
export async function getInvitations<T extends InvitationRelationKey[]>(includes?: T): Promise<InvitationWithRelations<T>[]> {
  const invitations = await drizzle
    .select()
    .from(InvitationsModel);

  const parsedInvitations = invitations.map(i => InvitationSchema.parse(i));
  return hydrateInvitations(parsedInvitations, includes);
}

/**
 * Get paginated invitations with optional relations.
 * @param pagination - Pagination parameters (page, limit, sortBy, sortOrder, search).
 * @param includes - The relations to include.
 * @returns Paginated invitations with relations.
 */
export async function getInvitationsPaginated<T extends InvitationRelationKey[]>(
  pagination: PaginationQuery,
  includes?: T,
): Promise<PaginatedResponse<InvitationWithRelations<T>>> {
  const { page, limit, sortBy, sortOrder, search } = pagination;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        ilike(InvitationsModel.email, `%${search}%`),
      )
    : undefined;

  const sortableColumns: Record<string, typeof InvitationsModel.id | typeof InvitationsModel.email | typeof InvitationsModel.status | typeof InvitationsModel.createdAt | typeof InvitationsModel.expiresAt> = {
    id: InvitationsModel.id,
    email: InvitationsModel.email,
    status: InvitationsModel.status,
    createdAt: InvitationsModel.createdAt,
    expiresAt: InvitationsModel.expiresAt,
  };

  const countQuery = drizzle
    .select({ count: count() })
    .from(InvitationsModel);

  if (searchCondition) {
    countQuery.where(searchCondition);
  }

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(InvitationsModel);

  if (searchCondition) {
    dataQuery.where(searchCondition);
  }

  const sortColumn = sortBy && sortableColumns[sortBy] ? sortableColumns[sortBy] : InvitationsModel.createdAt;
  if (sortOrder === "asc") {
    dataQuery.orderBy(asc(sortColumn));
  } else {
    dataQuery.orderBy(desc(sortColumn));
  }

  dataQuery.limit(limit).offset(offset);

  const invitations = await dataQuery;
  const parsedInvitations = invitations.map(i => InvitationSchema.parse(i));
  const hydratedInvitations = await hydrateInvitations(parsedInvitations, includes);

  return createPaginatedResponse(hydratedInvitations, total, page, limit);
}

/**
 * Get an invitation by id with optional relations.
 * @param id - The invitation id.
 * @param includes - The relations to include.
 * @returns The invitation with relations.
 */
export async function getInvitation<T extends InvitationRelationKey[]>(id: string, includes?: T): Promise<InvitationWithRelations<T> | null> {
  const [invitation] = await drizzle
    .select()
    .from(InvitationsModel)
    .where(eq(InvitationsModel.id, id));

  if (!invitation) {
    return null;
  }

  const parsedInvitation = InvitationSchema.parse(invitation);
  const [invitationWithRelations] = await hydrateInvitations([parsedInvitation], includes);

  return invitationWithRelations ?? null;
}

/**
 * Hydrate invitations with additional relations
 * @param invitations - The invitations to hydrate
 * @param includes - The relations to include
 * @returns The invitations with added relations
 */
export async function hydrateInvitations<T extends InvitationRelationKey[]>(invitations: Invitation[], includes?: T): Promise<InvitationWithRelations<T>[]> {
  if (!includes?.length) {
    return invitations.map(u => ({ ...u })) as InvitationWithRelations<T>[];
  }

  const invitationIds = invitations.map(u => u.id);

  const relations = await Promise.all(
    includes.map(async (key) => {
      const loader = invitationRelationLoaders[key];

      if (!loader) {
        throw new Error(`No relation loader defined for "${key}"`);
      }

      const data = await loader(invitationIds);
      return [key, data] as const;
    }),
  );

  return invitations.map((invitation) => {
    const withRelations: InvitationWithRelations<T> = { ...invitation } as InvitationWithRelations<T>;

    for (const [key, data] of relations) {
      attachRelation(withRelations, key, data[invitation.id] ?? null);
    }

    return withRelations;
  });
}

/**
 * Create a new invitation.
 * @param invitation - The invitation to create.
 * @returns The created invitation.
 */
export async function createInvitation(invitation: z.infer<typeof InsertInvitationSchema>): Promise<Invitation> {
  const [createdInvitation] = await drizzle
    .insert(InvitationsModel)
    .values(InsertInvitationSchema.parse(invitation))
    .returning();

  if (!createdInvitation) {
    throw new Error("Failed to create invitation");
  }

  return InvitationSchema.parse(createdInvitation);
}

/**
 * Update an invitation.
 * @param id - The invitation id.
 * @param invitation - The invitation data to update.
 * @returns The updated invitation.
 */
export async function updateInvitation(id: string, invitation: z.infer<typeof UpdateInvitationSchema>): Promise<Invitation> {
  const [updatedInvitation] = await drizzle
    .update(InvitationsModel)
    .set({ ...UpdateInvitationSchema.parse(invitation), updatedAt: new Date().toISOString() })
    .where(eq(InvitationsModel.id, id))
    .returning();

  if (!updatedInvitation) {
    throw new Error("Failed to update invitation");
  }

  return InvitationSchema.parse(updatedInvitation);
}

/**
 * Delete an invitation.
 * @param id - The invitation id.
 * @returns The deleted invitation.
 */
export async function deleteInvitation(id: string): Promise<Invitation> {
  const [deletedInvitation] = await drizzle
    .delete(InvitationsModel)
    .where(eq(InvitationsModel.id, id))
    .returning();

  if (!deletedInvitation) {
    throw new Error("Failed to delete invitation");
  }

  return InvitationSchema.parse(deletedInvitation);
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get an invitation by token.
 * @param token - The invitation token.
 * @returns The invitation or null if not found.
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const [invitation] = await drizzle
    .select()
    .from(InvitationsModel)
    .where(eq(InvitationsModel.token, token));

  return invitation ? InvitationSchema.parse(invitation) : null;
}

/**
 * Get a pending invitation by email.
 * @param email - The email address.
 * @returns The pending invitation or null if not found.
 */
export async function getPendingInvitationByEmail(email: string): Promise<Invitation | null> {
  const [invitation] = await drizzle
    .select()
    .from(InvitationsModel)
    .where(and(
      eq(InvitationsModel.email, email.toLowerCase()),
      eq(InvitationsModel.status, "pending"),
    ));

  return invitation ? InvitationSchema.parse(invitation) : null;
}

/**
 * Expire all pending invitations that have passed their expiration date.
 * @returns The number of expired invitations.
 */
export async function expireInvitations(): Promise<number> {
  const result = await drizzle
    .update(InvitationsModel)
    .set({ status: "expired", updatedAt: new Date().toISOString() })
    .where(and(
      eq(InvitationsModel.status, "pending"),
      lt(InvitationsModel.expiresAt, new Date().toISOString()),
    ))
    .returning();

  return result.length;
}

// ============================================================================
// Invitation Roles
// ============================================================================

/**
 * Create an invitation role.
 * @param invitationId - The invitation id.
 * @param roleId - The role id.
 */
export async function createInvitationRole(invitationId: string, roleId: number): Promise<void> {
  await drizzle
    .insert(InvitationRolesModel)
    .values({ invitationId, roleId })
    .onConflictDoNothing();
}

/**
 * Create multiple invitation roles.
 * @param invitationId - The invitation id.
 * @param roleIds - The role ids.
 */
export async function createInvitationRoles(invitationId: string, roleIds: number[]): Promise<void> {
  if (!roleIds.length) return;

  await drizzle
    .insert(InvitationRolesModel)
    .values(roleIds.map(roleId => ({ invitationId, roleId })))
    .onConflictDoNothing();
}

/**
 * Get role IDs for an invitation.
 * @param invitationId - The invitation id.
 * @returns The role IDs.
 */
export async function getInvitationRoleIds(invitationId: string): Promise<number[]> {
  const rows = await drizzle
    .select({ roleId: InvitationRolesModel.roleId })
    .from(InvitationRolesModel)
    .where(eq(InvitationRolesModel.invitationId, invitationId));

  return rows.map(r => r.roleId);
}
