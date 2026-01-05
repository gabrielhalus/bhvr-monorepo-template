import type { UserRole } from "~shared/types/db/user-roles.types";
import type { z } from "zod";

import { and, eq } from "drizzle-orm";

import { drizzle } from "~db/database";
import { UserRolesModel } from "~shared/models/user-roles.model";
import { UserRoleSchema } from "~shared/schemas/db/user-roles.schemas";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Create a new user-role relation.
 * @param userRole - The relation object.
 * @returns The created relation.
 * @throws An error if the relation could not be created.
 */
export async function createUserRole(userRole: z.infer<typeof UserRoleSchema>): Promise<UserRole> {
  const [createdUserRole] = await drizzle
    .insert(UserRolesModel)
    .values(userRole)
    .returning();

  if (!createdUserRole) {
    throw new Error("Failed to create user");
  }

  return UserRoleSchema.parse(createdUserRole);
}

/**
 * Delete a user-role relation.
 * @param userRole - The relation object.
 * @returns The deleted relation.
 * @throw An error if the relation could not be created
 */
export async function deleteUserRole(userRole: z.infer<typeof UserRoleSchema>): Promise<UserRole | null> {
  const [deletedUserRole] = await drizzle
    .delete(UserRolesModel)
    .where(and(eq(UserRolesModel.userId, userRole.userId), eq(UserRolesModel.roleId, userRole.roleId)))
    .returning();

  if (!deletedUserRole) {
    return null;
  }

  return UserRoleSchema.parse(deletedUserRole);
}
