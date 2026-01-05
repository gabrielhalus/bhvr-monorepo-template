import type { User, UserRelationKeys, UserRelations, UserWithRelations } from "~shared/types/db/users.types";
import type { z } from "zod";

import { eq } from "drizzle-orm";

import { drizzle } from "~db/database";
import { attachRelation } from "~shared/helpers";
import { RolesModel } from "~shared/models/roles.model";
import { TokensModel } from "~shared/models/tokens.model";
import { UserRolesModel } from "~shared/models/user-roles.model";
import { UsersModel } from "~shared/models/users.model";
import { RoleSchema } from "~shared/schemas/db/roles.schemas";
import { TokenSchema } from "~shared/schemas/db/tokens.schemas";
import { InsertUserSchema, UpdateUserSchema, UserSchema } from "~shared/schemas/db/users.schemas";

// ============================================================================
// Relation Loaders
// ============================================================================

const relationLoaders: { [K in keyof UserRelations]: (userId: string) => Promise<UserRelations[K]> } = {
  roles: async (userId) => {
    const userWithRelations = await drizzle
      .select({ role: RolesModel })
      .from(UserRolesModel)
      .leftJoin(RolesModel, eq(UserRolesModel.roleId, RolesModel.id))
      .where(eq(UserRolesModel.userId, userId));

    return userWithRelations
      .map(r => r.role)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map(r => RoleSchema.parse(r));
  },
  tokens: async (userId) => {
    const userWithRelations = await drizzle
      .select({ token: TokensModel })
      .from(TokensModel)
      .where(eq(TokensModel.userId, userId));

    return userWithRelations
      .map(r => r.token)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map(r => TokenSchema.parse(r));
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

  return Promise.all(parsedUsers.map(async (user) => {
    const parsedUser = UserSchema.parse(user);
    const userWithRelations = parsedUser as UserWithRelations<T>;

    if (includes) {
      await Promise.all(
        includes.map(async (key) => {
          const value = await relationLoaders[key](user.id);
          attachRelation(userWithRelations, key, value);
        }),
      );
    }

    return userWithRelations;
  }));
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
  const userWithRelations = parsedUser as UserWithRelations<T>;

  if (includes) {
    await Promise.all(
      includes.map(async (key) => {
        const value = await relationLoaders[key](user.id);
        attachRelation(userWithRelations, key, value);
      }),
    );
  }

  return userWithRelations;
}

/**
 * Hydrate users with additional relations
 * @param users - The users to hydrate
 * @param includes - The relations to include
 * @returns The users with added relations
 */
export async function hydrateUsers<T extends UserRelationKeys>(users: User[], includes: T): Promise<UserWithRelations<T>[]> {
  return Promise.all(
    users.map(async (user) => {
      const userWithRelations = user as UserWithRelations<T>;

      await Promise.all(
        includes.map(async (key) => {
          const value = await relationLoaders[key](user.id);
          attachRelation(userWithRelations, key, value);
        }),
      );

      return userWithRelations;
    }),
  );
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

  const userWithRelations = user as UserWithRelations<T>;

  if (includes) {
    await Promise.all(
      includes.map(async (key) => {
        const value = await relationLoaders[key](user.id);
        attachRelation(userWithRelations, key, value);
      }),
    );
  }

  return userWithRelations as UserWithRelations<T>;
};

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
