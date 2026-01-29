import type { WithRelations } from "../lib/type-utils";
import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { UpdateRoleSchema } from "../schemas/api/roles.schemas";
import type { InsertRoleSchema } from "../schemas/db/roles.schemas";
import type { Role, RoleRelationKeys, RoleRelations, RoleWithRelations } from "../types/db/roles.types";
import type { z } from "zod";

import { asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { PermissionSchema } from "~shared/schemas/api/permissions.schemas";

import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { PoliciesModel } from "../models/policies.model";
import { RolePermissionsModel } from "../models/role-permissions.model";
import { RolesModel } from "../models/roles.model";
import { UserRolesModel } from "../models/user-roles.model";
import { UsersModel } from "../models/users.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { PolicySchema } from "../schemas/db/policies.schemas";
import { RoleSchema } from "../schemas/db/roles.schemas";
import { UserSchema } from "../schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

export const roleRelationLoaders: { [K in keyof RoleRelations]: (roleIds: number[]) => Promise<Record<number, RoleRelations[K]>> } = {
  members: async (roleIds) => {
    const result: Record<number, RoleRelations["members"]> = {};

    if (!roleIds.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = []));

    const [userRolesRows, defaultRolesRows] = await Promise.all([
      drizzle
        .select({
          roleId: UserRolesModel.roleId,
          user: UsersModel,
        })
        .from(UserRolesModel)
        .leftJoin(UsersModel, eq(UserRolesModel.userId, UsersModel.id))
        .where(inArray(UserRolesModel.roleId, roleIds)),
      drizzle
        .select()
        .from(RolesModel)
        .where(eq(RolesModel.isDefault, true)),
    ]);

    for (const row of userRolesRows) {
      if (row.user !== null) {
        result[row.roleId]!.push(UserSchema.parse(row.user));
      }
    }

    if (defaultRolesRows.length) {
      const allUsers = await drizzle
        .select()
        .from(UsersModel);

      for (const row of defaultRolesRows) {
        result[row.id] = allUsers;
      }
    }

    return result;
  },

  permissions: async (roleIds) => {
    const result: Record<number, RoleRelations["permissions"]> = {};

    if (!roleIds.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = []));

    const rolePermissionsRows = await drizzle
      .select({
        roleId: RolePermissionsModel.roleId,
        permission: RolePermissionsModel.permission,
      })
      .from(RolePermissionsModel)
      .where(inArray(RolePermissionsModel.roleId, roleIds));

    for (const row of rolePermissionsRows) {
      if (row.permission !== null) {
        result[row.roleId]!.push(PermissionSchema.parse(row.permission));
      }
    }

    return result;
  },

  policies: async (roleIds) => {
    const result: Record<number, RoleRelations["policies"]> = {};

    if (!roleIds.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = []));

    const rolePoliciesRows = await drizzle
      .select({
        roleId: PoliciesModel.roleId,
        policy: PoliciesModel,
      })
      .from(PoliciesModel)
      .where(inArray(PoliciesModel.roleId, roleIds));

    for (const row of rolePoliciesRows) {
      if (row.roleId !== null && row.policy !== null) {
        result[row.roleId]!.push(PolicySchema.parse(row.policy));
      }
    }

    return result;
  },
};

export const roleRelationCountLoaders: { [K in keyof RoleRelations]: (roleIds: number[]) => Promise<Record<number, number>>; } = {
  members: async (roleIds) => {
    const result: Record<number, number> = {};

    if (!roleIds.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = 0));

    const [userRolesRows, defaultRolesRows] = await Promise.all([
      drizzle
        .select({
          roleId: UserRolesModel.roleId,
          count: count(UserRolesModel.userId),
        })
        .from(UserRolesModel)
        .where(inArray(UserRolesModel.roleId, roleIds)),
      drizzle
        .select({
          count: count(RolesModel.id),
        })
        .from(RolesModel)
        .where(eq(RolesModel.isDefault, true)),
    ]);

    for (const row of userRolesRows) {
      result[row.roleId]! = Number(row.count);
    }

    const defaultCount = defaultRolesRows[0]?.count ?? 0;
    if (defaultCount) {
      roleIds.forEach((roleId) => {
        result[roleId]! += Number(defaultCount);
      });
    }

    return result;
  },

  permissions: async (roleIds) => {
    const result: Record<number, number> = {};

    if (!roleIds.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = 0));

    const rolePermissionsRows = await drizzle
      .select({
        roleId: RolePermissionsModel.roleId,
        count: count(RolePermissionsModel.roleId),
      })
      .from(RolePermissionsModel)
      .where(inArray(RolePermissionsModel.roleId, roleIds));

    for (const row of rolePermissionsRows) {
      result[row.roleId]! = Number(row.count);
    }

    return result;
  },

  policies: async (roleIds) => {
    const result: Record<number, number> = {};

    if (!roleIds.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = 0));

    const rolePoliciesRows = await drizzle
      .select({
        roleId: PoliciesModel.roleId,
        count: count(PoliciesModel.roleId),
      })
      .from(PoliciesModel)
      .where(inArray(PoliciesModel.roleId, roleIds));

    for (const row of rolePoliciesRows) {
      if (row.roleId) {
        result[row.roleId]! = Number(row.count);
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
 * Get paginated roles with optional relations.
 * @param pagination - Pagination parameters (page, limit, sortBy, sortOrder, search).
 * @param includes - The relations to include.
 * @returns Paginated roles with relations.
 */
export async function getRolesPaginated<T extends RoleRelationKeys>(
  pagination: PaginationQuery,
  includes?: T,
): Promise<PaginatedResponse<RoleWithRelations<T>>> {
  const { page, limit, sortBy, sortOrder, search } = pagination;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        ilike(RolesModel.name, `%${search}%`),
        ilike(RolesModel.description, `%${search}%`),
      )
    : undefined;

  const sortableColumns: Record<string, typeof RolesModel.id | typeof RolesModel.name | typeof RolesModel.index> = {
    id: RolesModel.id,
    name: RolesModel.name,
    index: RolesModel.index,
  };

  const countQuery = drizzle
    .select({ count: count() })
    .from(RolesModel);

  if (searchCondition) {
    countQuery.where(searchCondition);
  }

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(RolesModel);

  if (searchCondition) {
    dataQuery.where(searchCondition);
  }

  const sortColumn = sortBy && sortableColumns[sortBy] ? sortableColumns[sortBy] : RolesModel.index;
  if (sortOrder === "asc") {
    dataQuery.orderBy(asc(sortColumn));
  } else {
    dataQuery.orderBy(desc(sortColumn));
  }

  dataQuery.limit(limit).offset(offset);

  const roles = await dataQuery;
  const parsedRoles = roles.map(r => RoleSchema.parse(r));
  const hydratedRoles = await hydrateRoles(parsedRoles, includes);

  return createPaginatedResponse(hydratedRoles, total, page, limit);
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
  if (!includes || !includes.length) {
    return roles.map(r => ({ ...r })) as RoleWithRelations<T>[];
  }

  const roleIds = roles.map(r => r.id);

  const relations = await Promise.all(
    includes.map(async (key) => {
      const loader = roleRelationLoaders[key];

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
      attachRelation(withRelations, key, data[role.id] ?? null);
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
