import type { UserRole } from "../types/db/user-roles.types";
import type { z } from "zod";

import { and, eq, inArray } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { RolesModel } from "../models/roles.model";
import { UserRolesModel } from "../models/user-roles.model";
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
export async function createUserRole(userRole: z.infer<typeof UserRoleSchema>): Promise<UserRole | null> {
  const [roleRow] = await drizzle
    .select()
    .from(RolesModel)
    .where(eq(RolesModel.id, userRole.roleId))
    .limit(1);

  if (!roleRow || roleRow.isDefault) {
    return null;
  }

  const [createdUserRole] = await drizzle
    .insert(UserRolesModel)
    .values(userRole)
    .returning();

  if (!createdUserRole) {
    throw new Error("Failed to create user role");
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

/**
 * Update the roles for a user.
 * Sets the complete list of non-default roles for a user.
 * Default roles cannot be removed/added through this function.
 * @param userId - The user ID.
 * @param roleIds - The new list of role IDs.
 */
export async function updateUserRoles(userId: string, roleIds: number[]): Promise<void> {
  const nonDefaultRoles = await drizzle
    .select({ id: RolesModel.id })
    .from(RolesModel)
    .where(eq(RolesModel.isDefault, false));

  const nonDefaultRoleIds = nonDefaultRoles.map(r => r.id);
  const validRoleIds = roleIds.filter(id => nonDefaultRoleIds.includes(id));

  await drizzle
    .delete(UserRolesModel)
    .where(and(
      eq(UserRolesModel.userId, userId),
      inArray(UserRolesModel.roleId, nonDefaultRoleIds),
    ));

  if (validRoleIds.length > 0) {
    await drizzle
      .insert(UserRolesModel)
      .values(validRoleIds.map(roleId => ({ userId, roleId })))
      .onConflictDoNothing();
  }
}

/**
 * Get role IDs for a user.
 * @param userId - The user ID.
 * @returns The role IDs.
 */
export async function getUserRoleIds(userId: string): Promise<number[]> {
  const rows = await drizzle
    .select({ roleId: UserRolesModel.roleId })
    .from(UserRolesModel)
    .where(eq(UserRolesModel.userId, userId));

  return rows.map(r => r.roleId);
}
