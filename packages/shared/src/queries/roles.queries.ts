import type { WithRelations } from "../lib/type-utils";
import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { InsertRoleSchema } from "../schemas/db/roles.schemas";
import type { Role, RoleRelationKeys, RoleRelations, RoleWithRelations } from "../types/db/roles.types";
import type { OrgId } from "../types/org.types";
import type { z } from "zod";

import { asc, count, desc, eq, ilike, inArray, isNull } from "drizzle-orm";

import { PermissionSchema } from "~shared/schemas/api/permissions.schemas";

import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { PoliciesModel } from "../models/policies.model";
import { RolePermissionsModel } from "../models/role-permissions.model";
import { RolesModel } from "../models/roles.model";
import { UserRolesModel } from "../models/user-roles.model";
import { UsersModel } from "../models/users.model";
import { getRoleCacheAdapter } from "../role-cache";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { PolicySchema } from "../schemas/db/policies.schemas";
import { RoleSchema } from "../schemas/db/roles.schemas";
import { UserSchema } from "../schemas/db/users.schemas";
import { orgScope } from "./scope";

// ============================================================================
// Relation Loaders
// ============================================================================

export const roleRelationLoaders: { [K in keyof RoleRelations]: (roleIds: number[]) => Promise<Record<number, RoleRelations[K]>> } = {
  members: async (roleIds) => {
    const result: Record<number, RoleRelations["members"]> = {};

    if (!roleIds?.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = []));

    const [userRolesRows] = await Promise.all([
      drizzle
        .select({
          roleId: UserRolesModel.roleId,
          user: UsersModel,
        })
        .from(UserRolesModel)
        .innerJoin(UsersModel, eq(UserRolesModel.userId, UsersModel.id))
        .where(inArray(UserRolesModel.roleId, roleIds)),
    ]);

    for (const row of userRolesRows) {
      if (row.user !== null) {
        result[row.roleId]!.push(UserSchema.parse(row.user));
      }
    }

    return result;
  },

  permissions: async (roleIds) => {
    const result: Record<number, RoleRelations["permissions"]> = {};

    if (!roleIds?.length) {
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

    if (!roleIds?.length) {
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

    if (!roleIds?.length) {
      return result;
    }

    roleIds.forEach(id => (result[id] = 0));

    const [userRolesRows] = await Promise.all([
      drizzle
        .select({
          roleId: UserRolesModel.roleId,
          count: count(UserRolesModel.userId),
        })
        .from(UserRolesModel)
        .where(inArray(UserRolesModel.roleId, roleIds))
        .groupBy(UserRolesModel.roleId),
    ]);

    for (const row of userRolesRows) {
      result[row.roleId]! = Number(row.count);
    }

    return result;
  },

  permissions: async (roleIds) => {
    const result: Record<number, number> = {};

    if (!roleIds?.length) {
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

    if (!roleIds?.length) {
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
 * Get all roles of an organization with optional relations.
 * @param orgId - The organization id.
 * @param includes - The relations to include.
 * @returns The roles with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getRoles<T extends RoleRelationKeys>(orgId: OrgId, includes?: T): Promise<RoleWithRelations<T>[]> {
  const roles = await drizzle
    .select()
    .from(RolesModel)
    .where(orgScope(RolesModel, orgId))
    .orderBy(desc(RolesModel.index));

  const parsedRoles = roles.map(r => RoleSchema.parse(r));
  return hydrateRoles(parsedRoles, includes);
}

/**
 * Get all platform roles (organizationId IS NULL) with optional relations.
 * @param includes - The relations to include.
 * @returns The platform roles with relations.
 */
export async function getPlatformRoles<T extends RoleRelationKeys>(includes?: T): Promise<RoleWithRelations<T>[]> {
  const roles = await drizzle
    .select()
    .from(RolesModel)
    .where(isNull(RolesModel.organizationId))
    .orderBy(desc(RolesModel.index));

  const parsedRoles = roles.map(r => RoleSchema.parse(r));
  return hydrateRoles(parsedRoles, includes);
}

/**
 * Get paginated roles of an organization with optional relations.
 * @param orgId - The organization id.
 * @param pagination - Pagination parameters (page, limit, sortBy, sortOrder, search).
 * @param includes - The relations to include.
 * @returns Paginated roles with relations.
 */
export async function getRolesPaginated<T extends RoleRelationKeys>(
  orgId: OrgId,
  pagination: PaginationQuery,
  includes?: T,
): Promise<PaginatedResponse<RoleWithRelations<T>>> {
  const { page, limit, sortBy, sortOrder, search } = pagination;
  const offset = (page - 1) * limit;

  const searchCondition = orgScope(RolesModel, orgId, search
    ? ilike(RolesModel.name, `%${search}%`)
    : undefined);

  const sortableColumns: Record<string, typeof RolesModel.id | typeof RolesModel.name | typeof RolesModel.index> = {
    id: RolesModel.id,
    name: RolesModel.name,
    index: RolesModel.index,
  };

  const countQuery = drizzle
    .select({ count: count() })
    .from(RolesModel)
    .where(searchCondition);

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(RolesModel)
    .where(searchCondition)
    .$dynamic();

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
 * Get a role by id within an organization, with optional relations.
 * The org filter doubles as an IDOR guard: a role id from another
 * organization resolves to null.
 * @param orgId - The organization id.
 * @param id - The role id.
 * @param includes - The relations to include.
 * @returns The role with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getRole<T extends RoleRelationKeys>(orgId: OrgId, id: number, includes?: T): Promise<RoleWithRelations<T> | null> {
  const [role] = await drizzle.select().from(RolesModel).where(orgScope(RolesModel, orgId, eq(RolesModel.id, id)));

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
  if (!includes?.length) {
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
 * Create a new role in an organization.
 * @param orgId - The organization id.
 * @param role - The role to create.
 * @returns The created role.
 * @throws An error if the role could not be created.
 */
export async function createRole(orgId: OrgId, role: Omit<z.infer<typeof InsertRoleSchema>, "organizationId">): Promise<Role> {
  const [createdRole] = await drizzle
    .insert(RolesModel)
    .values({ ...role, organizationId: orgId, isSuperAdmin: false })
    .returning();

  if (!createdRole) {
    throw new Error("Failed to create role");
  }

  return RoleSchema.parse(createdRole);
}

/**
 * Delete a role of an organization.
 * @param orgId - The organization id.
 * @param id - The role id.
 * @returns The deleted role.
 * @throws An error if the role could not be deleted.
 */
export async function deleteRole(orgId: OrgId, id: number): Promise<Role> {
  const [deletedRole] = await drizzle
    .delete(RolesModel)
    .where(orgScope(RolesModel, orgId, eq(RolesModel.id, id)))
    .returning();

  if (!deletedRole) {
    throw new Error("Failed to delete role");
  }

  // Drop the role's cached auth data; on failure the entry expires via TTL
  await getRoleCacheAdapter()?.remove([id]).catch(() => {});

  return RoleSchema.parse(deletedRole);
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get a role by name within an organization, with optional relations.
 * @param orgId - The organization id.
 * @param name - The role name.
 * @param includes - The relations to include.
 * @returns The role with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getRoleByName<T extends RoleRelationKeys>(orgId: OrgId, name: string, includes?: T): Promise<WithRelations<Role, RoleRelations, T> | null> {
  const [role] = await drizzle.select().from(RolesModel).where(orgScope(RolesModel, orgId, eq(RolesModel.name, name))).limit(1);

  if (!role) {
    return null;
  }

  const parsedRole = RoleSchema.parse(role);
  const [roleWithRelations] = await hydrateRoles([parsedRole], includes);

  return roleWithRelations ?? null;
}

/**
 * Get the default role of an organization (where isDefault is true).
 * @param orgId - The organization id.
 * @returns The default role, or null if none is set.
 */
export async function getDefaultRole(orgId: OrgId): Promise<Role | null> {
  const [role] = await drizzle.select().from(RolesModel).where(orgScope(RolesModel, orgId, eq(RolesModel.isDefault, true))).limit(1);

  if (!role) {
    return null;
  }

  return RoleSchema.parse(role);
}
