import type { UserRole } from "../types/db/user-roles.types";
import type { z } from "zod";

import { and, eq } from "drizzle-orm";

import { RolesModel } from "../models/roles.model";
import { UserRolesModel } from "../models/user-roles.model";
import { drizzle } from "../drizzle";
import { UserRoleSchema } from "../schemas/db/user-roles.schemas";

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
 * @throws An error if trying to delete the default role (soft-assigned, not removable).
 */
export async function deleteUserRole(userRole: z.infer<typeof UserRoleSchema>): Promise<UserRole | null> {
  const [role] = await drizzle
    .select({ isDefault: RolesModel.isDefault })
    .from(RolesModel)
    .where(eq(RolesModel.id, userRole.roleId))
    .limit(1);

  if (role?.isDefault) {
    throw new Error("Cannot remove the default role from a user");
  }

  const [deletedUserRole] = await drizzle
    .delete(UserRolesModel)
    .where(and(eq(UserRolesModel.userId, userRole.userId), eq(UserRolesModel.roleId, userRole.roleId)))
    .returning();

  if (!deletedUserRole) {
    return null;
  }

  return UserRoleSchema.parse(deletedUserRole);
}
