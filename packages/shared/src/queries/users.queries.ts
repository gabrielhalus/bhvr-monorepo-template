import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { User, UserRelationKey, UserRelations, UserWithRelations } from "../types/db/users.types";
import type { z } from "zod";

import { asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { RolesModel } from "../models/roles.model";
import { TokensModel } from "../models/tokens.model";
import { UserRolesModel } from "../models/user-roles.model";
import { UsersModel } from "../models/users.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";
import { RoleSchema } from "../schemas/db/roles.schemas";
import { TokenSchema } from "../schemas/db/tokens.schemas";
import { InsertUserSchema, UpdateUserSchema, UserSchema } from "../schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

export const userRelationLoaders: { [K in keyof UserRelations]: (userIds: string[]) => Promise<Record<string, UserRelations[K]>> } = {
  roles: async (userIds) => {
    const result: Record<string, UserRelations["roles"]> = {};

    if (!userIds?.length) {
      return result;
    }

    userIds.forEach(id => (result[id] = []));

    const [userRolesRows, defaultRolesRows] = await Promise.all([
      drizzle
        .select({
          userId: UserRolesModel.userId,
          role: RolesModel,
        })
        .from(UserRolesModel)
        .innerJoin(RolesModel, eq(UserRolesModel.roleId, RolesModel.id))
        .where(inArray(UserRolesModel.userId, userIds)),
      drizzle
        .select()
        .from(RolesModel)
        .where(eq(RolesModel.isDefault, true)),
    ]);

    for (const row of userRolesRows) {
      if (row.role !== null) {
        result[row.userId]!.push(RoleSchema.parse(row.role));
      }
    }

    if (defaultRolesRows.length) {
      for (const row of defaultRolesRows) {
        userIds.forEach((userId) => {
          result[userId]!.push(RoleSchema.parse(row));
        });
      }
    }

    return result;
  },

  tokens: async (userIds) => {
    const result: Record<string, UserRelations["tokens"]> = {};

    if (!userIds?.length) {
      return result;
    }

    userIds.forEach(id => (result[id] = []));

    const userTokensRows = await drizzle
      .select({
        userId: TokensModel.userId,
        token: TokensModel,
      })
      .from(TokensModel)
      .where(inArray(TokensModel.userId, userIds));

    for (const row of userTokensRows) {
      if (row.token !== null) {
        result[row.userId]!.push(TokenSchema.parse(row.token));
      }
    }

    return result;
  },
};

export const userRelationCountLoaders: { [K in keyof UserRelations]: (userIds: string[]) => Promise<Record<string, number>>; } = {
  roles: async (userIds) => {
    const result: Record<string, number> = {};

    if (!userIds?.length) {
      return result;
    }

    userIds.forEach(id => (result[id] = 0));

    const [userRolesRows, defaultRolesRows] = await Promise.all([
      drizzle
        .select({
          userId: UserRolesModel.userId,
          count: count(RolesModel.id),
        })
        .from(UserRolesModel)
        .innerJoin(RolesModel, eq(UserRolesModel.roleId, RolesModel.id))
        .where(inArray(UserRolesModel.userId, userIds))
        .groupBy(UserRolesModel.userId),
      drizzle
        .select({
          count: count(RolesModel.id),
        })
        .from(RolesModel)
        .where(eq(RolesModel.isDefault, true)),
    ]);

    for (const row of userRolesRows) {
      result[row.userId] = Number(row.count);
    };

    const defaultCount = defaultRolesRows[0]?.count ?? 0;
    if (defaultCount) {
      userIds.forEach((userId) => {
        result[userId]! += Number(defaultCount);
      });
    }

    return result;
  },

  tokens: async (userIds) => {
    const result: Record<string, number> = {};

    if (!userIds?.length) {
      return result;
    }

    userIds.forEach(id => (result[id] = 0));

    const userTokensRows = await drizzle
      .select({
        userId: TokensModel.userId,
        count: count(TokensModel.id),
      })
      .from(TokensModel)
      .where(inArray(TokensModel.userId, userIds))
      .groupBy(TokensModel.userId);

    for (const row of userTokensRows) {
      result[row.userId] = Number(row.count);
    };

    return result;
  },
};

// ============================================================================
// Core CRUD Operation
// ============================================================================

/**
 * Get all users with optional relations.
 * @param includes - The relations to include.
 * @returns The users with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getUsers<T extends UserRelationKey[]>(includes?: T): Promise<UserWithRelations<T>[]> {
  const users = await drizzle
    .select()
    .from(UsersModel);

  const parsedUsers = users.map(u => UserSchema.parse(u));
  return hydrateUsers(parsedUsers, includes);
}

/**
 * Get paginated users with optional relations.
 * @param pagination - Pagination parameters (page, limit, sortBy, sortOrder, search).
 * @param includes - The relations to include.
 * @returns Paginated users with relations.
 */
export async function getUsersPaginated<T extends UserRelationKey[]>(
  pagination: PaginationQuery,
  includes?: T,
): Promise<PaginatedResponse<UserWithRelations<T>>> {
  const { page, limit, sortBy, sortOrder, search } = pagination;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        ilike(UsersModel.firstName, `%${search}%`),
        ilike(UsersModel.lastName, `%${search}%`),
        ilike(UsersModel.email, `%${search}%`),
      )
    : undefined;

  const sortableColumns: Record<string, typeof UsersModel.id | typeof UsersModel.firstName | typeof UsersModel.lastName | typeof UsersModel.email | typeof UsersModel.createdAt> = {
    id: UsersModel.id,
    firstName: UsersModel.firstName,
    lastName: UsersModel.lastName,
    email: UsersModel.email,
    createdAt: UsersModel.createdAt,
  };

  const countQuery = drizzle
    .select({ count: count() })
    .from(UsersModel);

  if (searchCondition) {
    countQuery.where(searchCondition);
  }

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(UsersModel);

  if (searchCondition) {
    dataQuery.where(searchCondition);
  }

  const sortColumn = sortBy && sortableColumns[sortBy] ? sortableColumns[sortBy] : UsersModel.createdAt;
  if (sortOrder === "asc") {
    dataQuery.orderBy(asc(sortColumn));
  } else {
    dataQuery.orderBy(desc(sortColumn));
  }

  dataQuery.limit(limit).offset(offset);

  const users = await dataQuery;
  const parsedUsers = users.map(u => UserSchema.parse(u));
  const hydratedUsers = await hydrateUsers(parsedUsers, includes);

  return createPaginatedResponse(hydratedUsers, total, page, limit);
}

/**
 * Get a user by id with optional relations.
 * @param id - The user id.
 * @param includes - The relations to include.
 * @returns The user with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getUser<T extends UserRelationKey[]>(id: string, includes?: T): Promise<UserWithRelations<T> | null> {
  const [user] = await drizzle
    .select()
    .from(UsersModel)
    .where(eq(UsersModel.id, id));

  if (!user) {
    return null;
  }

  const parsedUser = UserSchema.parse(user);
  const [userWithRelations] = await hydrateUsers([parsedUser], includes);

  return userWithRelations ?? null;
}

/**
 * Hydrate users with additional relations
 * @param users - The users to hydrate
 * @param includes - The relations to include
 * @returns The users with added relations
 */
export async function hydrateUsers<T extends UserRelationKey[]>(users: User[], includes?: T): Promise<UserWithRelations<T>[]> {
  if (!includes?.length) {
    return users.map(u => ({ ...u })) as UserWithRelations<T>[];
  }

  const userIds = users.map(u => u.id);

  const relations = await Promise.all(
    includes.map(async (key) => {
      const loader = userRelationLoaders[key];

      if (!loader) {
        throw new Error(`No relation loader defined for "${key}"`);
      }

      const data = await loader(userIds);
      return [key, data] as const;
    }),
  );

  return users.map((user) => {
    const withRelations: UserWithRelations<T> = { ...user } as UserWithRelations<T>;

    for (const [key, data] of relations) {
      attachRelation(withRelations, key, data[user.id] ?? null);
    }

    return withRelations;
  });
}

/**
 * Create a new user.
 * @param user - The user to create.
 * @returns The created user.
 * @throws An error if the user could not be created.
 */
export async function createUser(user: z.infer<typeof InsertUserSchema>): Promise<User> {
  const [createdUser] = await drizzle
    .insert(UsersModel)
    .values(InsertUserSchema.parse(user))
    .returning();

  if (!createdUser) {
    throw new Error("Failed to create user");
  }

  return UserSchema.parse(createdUser);
}

/**
 * Update a user.
 * @param id - The user id.
 * @param user - The user to update.
 * @returns The updated user.
 * @throws An error if the user could not be updated.
 */
export async function updateUser(id: string, user: z.infer<typeof UpdateUserSchema>): Promise<User> {
  const [updatedUser] = await drizzle
    .update(UsersModel)
    .set(UpdateUserSchema.parse(user))
    .where(eq(UsersModel.id, id))
    .returning();

  if (!updatedUser) {
    throw new Error("Failed to update user");
  }

  return UserSchema.parse(updatedUser);
}

/**
 * Delete a user.
 * @param id - The user id.
 * @returns The deleted user.
 * @throws An error if the user could not be deleted.
 */
export async function deleteUser(id: string): Promise<User> {
  const [deletedUser] = await drizzle
    .delete(UsersModel)
    .where(eq(UsersModel.id, id))
    .returning();

  if (!deletedUser) {
    throw new Error("Failed to delete user");
  }

  return UserSchema.parse(deletedUser);
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get a user by email with optional relations.
 * @param email - The user email.
 * @param includes - The relations to include.
 * @returns The user with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getUserByEmail<T extends UserRelationKey[]>(email: string, includes?: T): Promise<UserWithRelations<T> | null> {
  const [user] = await drizzle
    .select()
    .from(UsersModel)
    .where(eq(UsersModel.email, email));

  if (!user) {
    return null;
  }

  const parsedUser = UserSchema.parse(user);
  const [userWithRelations] = await hydrateUsers([parsedUser], includes);

  return userWithRelations ?? null;
}

/**
 * Authenticates a user by verifying their email and password.
 *
 * @param email - The user's email address
 * @param password - The user's password
 * @returns The user's ID if authentication succeeds, null otherwise
 */
export async function signIn(email: string, password: string): Promise<string | null> {
  const [user] = await drizzle
    .select({ id: UsersModel.id, password: UsersModel.password })
    .from(UsersModel)
    .where(eq(UsersModel.email, email))
    .limit(1);

  if (!user?.password) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return null;
  }

  const isValid = await Bun.password.verify(password, user.password);

  if (!isValid) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return null;
  }

  return user.id;
}

/**
 * Check if an email is already registered.
 * @param email - The email address to check.
 * @returns True if the email exists, false otherwise.
 */
export async function emailExists(email: string): Promise<boolean> {
  const [user] = await drizzle
    .select({ exists: UsersModel.id })
    .from(UsersModel)
    .where(eq(UsersModel.email, email))
    .limit(1);

  return !!user;
}

/**
 * Update a user's password.
 * @param id - The user id.
 * @param hashedPassword - The hashed password to set.
 * @returns The updated user.
 * @throws An error if the user could not be updated.
 */
export async function updateUserPassword(id: string, hashedPassword: string): Promise<User> {
  const [updatedUser] = await drizzle
    .update(UsersModel)
    .set({ password: hashedPassword, updatedAt: new Date().toISOString() })
    .where(eq(UsersModel.id, id))
    .returning();

  if (!updatedUser) {
    throw new Error("Failed to update user password");
  }

  return UserSchema.parse(updatedUser);
}
