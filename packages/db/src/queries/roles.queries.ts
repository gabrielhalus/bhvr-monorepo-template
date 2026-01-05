import type { WithRelations } from "~shared/lib/type-utils";
import type { UpdateRoleSchema } from "~shared/schemas/api/roles.schemas";
import type { InsertRoleSchema } from "~shared/schemas/db/roles.schemas";
import type { Role, RoleRelationKeys, RoleRelations, RoleWithRelations } from "~shared/types/db/roles.types";
import type { z } from "zod";

import { eq } from "drizzle-orm";

import { drizzle } from "~db/database";
import { attachRelation } from "~shared/helpers";
import { PoliciesModel } from "~shared/models/policies.model";
import { RolePermissionsModel } from "~shared/models/role-permissions.model";
import { RolesModel } from "~shared/models/roles.model";
import { UserRolesModel } from "~shared/models/user-roles.model";
import { UsersModel } from "~shared/models/users.model";
import { PolicySchema } from "~shared/schemas/db/policies.schemas";
import { RoleSchema } from "~shared/schemas/db/roles.schemas";
import { UserSchema } from "~shared/schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

const relationLoaders: { [K in keyof RoleRelations]: (roleId: number) => Promise<RoleRelations[K]> } = {
  members: async (roleId) => {
    const rows = await drizzle
      .select({ member: UsersModel })
      .from(UserRolesModel)
      .leftJoin(UsersModel, eq(UserRolesModel.userId, UsersModel.id))
      .where(eq(UserRolesModel.roleId, roleId));

    return rows
      .map(r => r.member)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map(r => UserSchema.parse(r));
  },
  permissions: async (roleId) => {
    const rows = await drizzle
      .select({ permission: RolePermissionsModel.permission })
      .from(RolePermissionsModel)
      .where(eq(RolePermissionsModel.roleId, roleId));

    return rows
      .map(r => r.permission)
      .filter((r): r is NonNullable<typeof r> => r !== null);
  },
  policies: async (roleId) => {
    const rows = await drizzle
      .select({ policy: PoliciesModel })
      .from(PoliciesModel)
      .where(eq(PoliciesModel.roleId, roleId));

    return rows
      .map(r => r.policy)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map(r => PolicySchema.parse(r));
  },
};

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Get all roles with optional relations.
 * @param includes - The relations to include.
 * @returns The roles with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getRoles<T extends RoleRelationKeys>(includes?: T): Promise<RoleWithRelations<T>[]> {
  const roles = await drizzle.select().from(RolesModel);
  const parsedRoles = roles.map(r => RoleSchema.parse(r));

  return Promise.all(parsedRoles.map(async (role) => {
    const roleWithRelations = role as RoleWithRelations<T>;

    if (includes) {
      await Promise.all(
        includes.map(async (key) => {
          const value = await relationLoaders[key](role.id);
          attachRelation(roleWithRelations, key, value);
        }),
      );
    }

    return roleWithRelations;
  }));
}

/**
 * Get a role by id with optional relations.
 * @param id - The role id.
 * @param includes - The relations to include.
 * @returns The role with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getRole<T extends RoleRelationKeys>(id: number, includes?: T): Promise<RoleWithRelations<T> | null> {
  const [role] = await drizzle.select().from(RolesModel).where(eq(RolesModel.id, id));

  if (!role) {
    return null;
  }

  const parsedRole = RoleSchema.parse(role);
  const roleWithRelations = parsedRole as RoleWithRelations<T>;

  if (includes) {
    await Promise.all(
      includes.map(async (key) => {
        const value = await relationLoaders[key](role.id);
        attachRelation(roleWithRelations, key, value);
      }),
    );
  }

  return roleWithRelations;
}

/**
 * Hydrate roles with additional relations
 * @param roles - The roles to hydrate
 * @param includes - The relations to include
 * @returns The roles with added relations
 */
export async function hydrateRoles<T extends RoleRelationKeys>(roles: Role[], includes: T): Promise<RoleWithRelations<T>[]> {
  return Promise.all(
    roles.map(async (role) => {
      const roleWithRelations = role as RoleWithRelations<T>;

      await Promise.all(
        includes.map(async (key) => {
          const value = await relationLoaders[key](role.id);
          attachRelation(roleWithRelations, key, value);
        }),
      );

      return roleWithRelations;
    }),
  );
}

/**
 * Create a new role.
 * @param role - The role to create.
 * @returns The created role.
 * @throws An error if the role could not be created.
 */
export async function createRole(role: z.infer<typeof InsertRoleSchema>): Promise<Role> {
  const [createdRole] = await drizzle
    .insert(RolesModel)
    .values(role)
    .returning();

  if (!createdRole) {
    throw new Error("Failed to create role");
  }

  return RoleSchema.parse(createdRole);
}

/**
 * Update a role.
 * @param id - The role id.
 * @param role - The role to update.
 * @returns The updated role.
 * @throws An error if the role could not be updated.
 */
export async function updateRole(id: number, role: z.infer<typeof UpdateRoleSchema>): Promise<Role> {
  const [updatedRole] = await drizzle
    .update(RolesModel)
    .set(role)
    .where(eq(RolesModel.id, id))
    .returning();

  if (!updatedRole) {
    throw new Error("Failed to update role");
  }

  return RoleSchema.parse(updatedRole);
}

/**
 * Delete a role.
 * @param id - The role id.
 * @returns The deleted role.
 * @throws An error if the role could not be deleted.
 */
export async function deleteRole(id: number): Promise<Role> {
  const [deletedRole] = await drizzle
    .delete(RolesModel)
    .where(eq(RolesModel.id, id))
    .returning();

  if (!deletedRole) {
    throw new Error("Failed to delete role");
  }

  return RoleSchema.parse(deletedRole);
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get a role by name with optional relations.
 * @param name - The role name.
 * @param includes - The relations to include.
 * @returns The role with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getRoleByName<T extends RoleRelationKeys>(name: string, includes?: T): Promise<WithRelations<Role, RoleRelations, T> | null> {
  const [role] = await drizzle.select().from(RolesModel).where(eq(RolesModel.name, name)).limit(1);

  if (!role) {
    return null;
  }

  const roleWithRelations = role as RoleWithRelations<T>;

  if (includes) {
    await Promise.all(
      includes.map(async (key) => {
        const value = await relationLoaders[key](role.id);
        attachRelation(roleWithRelations, key, value);
      }),
    );
  }

  return roleWithRelations;
}
