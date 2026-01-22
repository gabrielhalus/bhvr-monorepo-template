import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { Invitation, InvitationRelationKeys, InvitationRelations, InvitationWithRelations } from "../types/db/invitations.types";
import type { z } from "zod";

import { and, asc, count, desc, eq, ilike, lt, or } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { InvitationsModel } from "../models/invitations.model";
import { UsersModel } from "../models/users.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { InsertInvitationSchema, InvitationSchema, UpdateInvitationSchema } from "../schemas/db/invitations.schemas";
import { UserSchema } from "../schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

const relationLoaders: { [K in keyof InvitationRelations]: (invitedById: string) => Promise<InvitationRelations[K]> } = {
  invitedBy: async (invitedById) => {
    const [user] = await drizzle
      .select()
      .from(UsersModel)
      .where(eq(UsersModel.id, invitedById));

    if (!user) {
      throw new Error("Invited by user not found");
    }

    return UserSchema.parse(user);
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
export async function getInvitations<T extends InvitationRelationKeys>(includes?: T): Promise<InvitationWithRelations<T>[]> {
  const invitations = await drizzle.select().from(InvitationsModel);
  const parsedInvitations = invitations.map(i => InvitationSchema.parse(i));

  return Promise.all(parsedInvitations.map(async (invitation) => {
    const invitationWithRelations = invitation as InvitationWithRelations<T>;

    if (includes) {
      await Promise.all(
        includes.map(async (key) => {
          const value = await relationLoaders[key](invitation.invitedById);
          attachRelation(invitationWithRelations, key, value);
        }),
      );
    }

    return invitationWithRelations;
  }));
}

/**
 * Get paginated invitations with optional relations.
 * @param pagination - Pagination parameters (page, limit, sortBy, sortOrder, search).
 * @param includes - The relations to include.
 * @returns Paginated invitations with relations.
 */
export async function getInvitationsPaginated<T extends InvitationRelationKeys>(
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

  const hydratedInvitations = await Promise.all(parsedInvitations.map(async (invitation) => {
    const invitationWithRelations = invitation as InvitationWithRelations<T>;

    if (includes) {
      await Promise.all(
        includes.map(async (key) => {
          const value = await relationLoaders[key](invitation.invitedById);
          attachRelation(invitationWithRelations, key, value);
        }),
      );
    }

    return invitationWithRelations;
  }));

  return createPaginatedResponse(hydratedInvitations, total, page, limit);
}

/**
 * Get an invitation by id with optional relations.
 * @param id - The invitation id.
 * @param includes - The relations to include.
 * @returns The invitation with relations.
 */
export async function getInvitation<T extends InvitationRelationKeys>(id: string, includes?: T): Promise<InvitationWithRelations<T> | null> {
  const [invitation] = await drizzle
    .select()
    .from(InvitationsModel)
    .where(eq(InvitationsModel.id, id));

  if (!invitation) {
    return null;
  }

  const parsedInvitation = InvitationSchema.parse(invitation);
  const invitationWithRelations = parsedInvitation as InvitationWithRelations<T>;

  if (includes) {
    await Promise.all(
      includes.map(async (key) => {
        const value = await relationLoaders[key](invitation.invitedById);
        attachRelation(invitationWithRelations, key, value);
      }),
    );
  }

  return invitationWithRelations;
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
