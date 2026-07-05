import type { InsertUserSchema } from "~shared/schemas/db/users.schemas";
import type { z } from "zod";

import { getDefaultRole, getRoleByName } from "~shared/queries/roles.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { countUsers, createUser } from "~shared/queries/users.queries";

/**
 * Create a user and assign their initial role.
 *
 * The very first account bootstraps the instance: it receives the `admin` role
 * and is flagged as a system user (`metadata.system`). Every subsequent account
 * receives the configured default role.
 *
 * @param user - The user to create (password may be omitted for OAuth signups)
 * @returns The created user
 */
export async function provisionUser(user: z.infer<typeof InsertUserSchema>) {
  const isFirstUser = (await countUsers()) === 0;

  const insertedUser = await createUser({
    ...user,
    ...(isFirstUser && { metadata: { system: true } }),
  });

  const role = isFirstUser ? await getRoleByName("admin") : await getDefaultRole();
  if (role) {
    await createUserRole({ userId: insertedUser.id, roleId: role.id });
  }

  return insertedUser;
}
