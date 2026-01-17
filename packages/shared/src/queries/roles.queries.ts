import type { WithRelations } from "../lib/type-utils";
import type { UpdateRoleSchema } from "../schemas/api/roles.schemas";
import type { InsertRoleSchema } from "../schemas/db/roles.schemas";
import type { Role, RoleRelationKeys, RoleRelations, RoleWithRelations } from "../types/db/roles.types";
import type { z } from "zod";

import { desc, eq, inArray } from "drizzle-orm";

import { PoliciesModel } from "../models/policies.model";
import { RolePermissionsModel } from "../models/role-permissions.model";
import { RolesModel } from "../models/roles.model";
import { UserRolesModel } from "../models/user-roles.model";
import { UsersModel } from "../models/users.model";
import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { PolicySchema } from "../schemas/db/policies.schemas";
import { RoleSchema } from "../schemas/db/roles.schemas";
import { UserSchema } from "../schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

const relationLoaders: { [K in keyof RoleRelations]: (roleIds: number[]) => Promise<Map<number, RoleRelations[K]>> } = {
  members: async (roleIds) => {
    const result = new Map<number, RoleRelations["members"]>();

    if (roleIds.length === 0) {
      return result;
    }

    for (const roleId of roleIds) {
      result.set(roleId, []);
    }

    const roles = await drizzle
      .select({ id: RolesModel.id, isDefault: RolesModel.isDefault })
      .from(RolesModel)
      .where(inArray(RolesModel.id, roleIds));

    const defaultRoleIds = roles.filter(r => r.isDefault).map(r => r.id);
    const nonDefaultRoleIds = roles.filter(r => !r.isDefault).map(r => r.id);

    if (defaultRoleIds.length > 0) {
      const allUsers = await drizzle.select().from(UsersModel);
      const parsedUsers = allUsers.map(u => UserSchema.parse(u));

      for (const roleId of defaultRoleIds) {
        result.set(roleId, parsedUsers);
      }
    }

    if (nonDefaultRoleIds.length > 0) {
      const rows = await drizzle
        .select({
          roleId: UserRolesModel.roleId,
          member: UsersModel,
        })
        .from(UserRolesModel)
        .innerJoin(UsersModel, eq(UserRolesModel.userId, UsersModel.id))
        .where(inArray(UserRolesModel.roleId, nonDefaultRoleIds));

      for (const row of rows) {
        const members = result.get(row.roleId) ?? [];
        members.push(UserSchema.parse(row.member));
        result.set(row.roleId, members);
      }
    }

    return result;
  },

  permissions: async (roleIds) => {
    const result = new Map<number, RoleRelations["permissions"]>();

    if (roleIds.length === 0) {
      return result;
    }

    // Initialize empty arrays for all requested roleIds
    for (const roleId of roleIds) {
      result.set(roleId, []);
    }

    const rows = await drizzle
      .select({
        roleId: RolePermissionsModel.roleId,
        permission: RolePermissionsModel.permission,
      })
      .from(RolePermissionsModel)
      .where(inArray(RolePermissionsModel.roleId, roleIds));

    for (const row of rows) {
      if (row.permission !== null) {
        const permissions = result.get(row.roleId) ?? [];
        permissions.push(row.permission);
        result.set(row.roleId, permissions);
      }
    }

    return result;
  },

  policies: async (roleIds) => {
    const result = new Map<number, RoleRelations["policies"]>();

    if (roleIds.length === 0) {
      return result;
    }

    // Initialize empty arrays for all requested roleIds
    for (const roleId of roleIds) {
      result.set(roleId, []);
    }

    const rows = await drizzle
      .select({
        roleId: PoliciesModel.roleId,
        policy: PoliciesModel,
      })
      .from(PoliciesModel)
      .where(inArray(PoliciesModel.roleId, roleIds));

    for (const row of rows) {
      if (row.roleId !== null && row.policy !== null) {
        const policies = result.get(row.roleId) ?? [];
        policies.push(PolicySchema.parse(row.policy));
        result.set(row.roleId, policies);
      }
    }

    return result;
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
  const roles = await drizzle
    .select()
    .from(RolesModel)
    .orderBy(desc(RolesModel.index));

  const parsedRoles = roles.map(r => RoleSchema.parse(r));
  return hydrateRoles(parsedRoles, includes);
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
  const [roleWithRelations] = await hydrateRoles([parsedRole], includes);

  return roleWithRelations ?? null;
}

/**
 * Hydrate roles with additional relations
 * @param roles - The roles to hydrate
 * @param includes - The relations to include
 * @returns The roles with added relations
 */
export async function hydrateRoles<T extends RoleRelationKeys>(roles: Role[], includes?: T): Promise<RoleWithRelations<T>[]> {
  if (!includes || includes.length === 0) {
    return roles.map(r => ({ ...r })) as RoleWithRelations<T>[];
  }

  const roleIds = roles.map(r => r.id);

  const relations = await Promise.all(
    includes.map(async (key) => {
      const loader = relationLoaders[key];

      if (!loader) {
        throw new Error(`No relation loader defined for "${key}"`);
      }

      const data = await loader(roleIds);
      return [key, data] as const;
    }),
  );

  return roles.map((role) => {
    const withRelations: RoleWithRelations<T> = { ...role } as RoleWithRelations<T>;

    for (const [key, data] of relations) {
      attachRelation(withRelations, key, data.get(role.id) ?? null);
    }

    return withRelations;
  });
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

  const parsedRole = RoleSchema.parse(role);
  const [roleWithRelations] = await hydrateRoles([parsedRole], includes);

  return roleWithRelations ?? null;
}

/**
 * Get the default role (where isDefault is true).
 * @returns The default role, or null if none is set.
 */
export async function getDefaultRole(): Promise<Role | null> {
  const [role] = await drizzle.select().from(RolesModel).where(eq(RolesModel.isDefault, true)).limit(1);

  if (!role) {
    return null;
  }

  return RoleSchema.parse(role);
}
