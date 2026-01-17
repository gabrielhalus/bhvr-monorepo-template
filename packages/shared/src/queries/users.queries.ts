import type { User, UserRelationKeys, UserRelations, UserWithRelations } from "../types/db/users.types";
import type { z } from "zod";

import { eq, inArray } from "drizzle-orm";

import { RolesModel } from "../models/roles.model";
import { TokensModel } from "../models/tokens.model";
import { UserRolesModel } from "../models/user-roles.model";
import { UsersModel } from "../models/users.model";
import { drizzle } from "../drizzle";
import { attachRelation } from "../helpers";
import { RoleSchema } from "../schemas/db/roles.schemas";
import { TokenSchema } from "../schemas/db/tokens.schemas";
import { InsertUserSchema, UpdateUserSchema, UserSchema } from "../schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

const relationLoaders: { [K in keyof UserRelations]: (userIds: string[]) => Promise<Map<string, UserRelations[K]>> } = {
  roles: async (userIds) => {
    const result = new Map<string, UserRelations["roles"]>();

    if (userIds.length === 0) {
      return result;
    }

    for (const userId of userIds) {
      result.set(userId, []);
    }

    const [assignedRoles, defaultRole] = await Promise.all([
      drizzle
        .select({
          userId: UserRolesModel.userId,
          role: RolesModel,
        })
        .from(UserRolesModel)
        .leftJoin(RolesModel, eq(UserRolesModel.roleId, RolesModel.id))
        .where(inArray(UserRolesModel.userId, userIds)),
      drizzle
        .select()
        .from(RolesModel)
        .where(eq(RolesModel.isDefault, true))
        .limit(1),
    ]);

    for (const row of assignedRoles) {
      if (row.role !== null) {
        const roles = result.get(row.userId) ?? [];
        roles.push(RoleSchema.parse(row.role));
        result.set(row.userId, roles);
      }
    }

    // Add default role to all users if it exists and not already assigned
    if (defaultRole[0]) {
      const parsedDefaultRole = RoleSchema.parse(defaultRole[0]);

      for (const userId of userIds) {
        const roles = result.get(userId) ?? [];
        if (!roles.some(r => r.id === parsedDefaultRole.id)) {
          roles.push(parsedDefaultRole);
          result.set(userId, roles);
        }
      }
    }

    return result;
  },

  tokens: async (userIds) => {
    const result = new Map<string, UserRelations["tokens"]>();

    if (userIds.length === 0) {
      return result;
    }

    for (const userId of userIds) {
      result.set(userId, []);
    }

    const rows = await drizzle
      .select({
        userId: TokensModel.userId,
        token: TokensModel,
      })
      .from(TokensModel)
      .where(inArray(TokensModel.userId, userIds));

    for (const row of rows) {
      if (row.token !== null) {
        const tokens = result.get(row.userId) ?? [];
        tokens.push(TokenSchema.parse(row.token));
        result.set(row.userId, tokens);
      }
    }

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
export async function getUsers<T extends UserRelationKeys>(includes?: T): Promise<UserWithRelations<T>[]> {
  const users = await drizzle
    .select()
    .from(UsersModel);

  const parsedUsers = users.map(u => UserSchema.parse(u));
  return hydrateUsers(parsedUsers, includes);
}

/**
 * Get a user by id with optional relations.
 * @param id - The user id.
 * @param includes - The relations to include.
 * @returns The user with relations.
 * @throws An error if a loader is not defined for a relation.
 */
export async function getUser<T extends UserRelationKeys>(id: string, includes?: T): Promise<UserWithRelations<T> | null> {
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
export async function hydrateUsers<T extends UserRelationKeys>(users: User[], includes?: T): Promise<UserWithRelations<T>[]> {
  if (!includes || includes.length === 0) {
    return users.map(u => ({ ...u })) as UserWithRelations<T>[];
  }

  const userIds = users.map(u => u.id);

  const relations = await Promise.all(
    includes.map(async (key) => {
      const loader = relationLoaders[key];

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
      attachRelation(withRelations, key, data.get(user.id) ?? null);
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
export async function getUserByEmail<T extends UserRelationKeys>(email: string, includes?: T): Promise<UserWithRelations<T> | null> {
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
