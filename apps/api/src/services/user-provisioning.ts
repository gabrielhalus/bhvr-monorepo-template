import type { InsertUserSchema } from "~shared/schemas/db/users.schemas";
import type { OrgId } from "~shared/types/org.types";
import type { z } from "zod";

import { addMember } from "~shared/queries/organization-members.queries";
import { getPlatformRoles, getRoleByName } from "~shared/queries/roles.queries";
import { createUserRole } from "~shared/queries/user-roles.queries";
import { countUsers, createUser } from "~shared/queries/users.queries";

/**
 * Create a user, add them to the organization they registered on, and assign
 * their initial roles.
 *
 * The very first account bootstraps the instance: it becomes the platform
 * administrator (platform-admin role), is flagged as a system user
 * (`metadata.system`), and receives the organization's owner role (falling
 * back to admin for orgs migrated from single-tenant installs). Every
 * subsequent account only gets a membership — the organization's default
 * role applies implicitly.
 *
 * @param orgId - The organization the user registers into
 * @param user - The user to create (password may be omitted for OAuth signups)
 * @returns The created user
 */
export async function provisionUser(orgId: OrgId, user: z.infer<typeof InsertUserSchema>) {
  const isFirstUser = (await countUsers()) === 0;

  const insertedUser = await createUser({
    ...user,
    ...(isFirstUser && { metadata: { system: true } }),
  });

  await addMember(orgId, insertedUser.id);

  if (isFirstUser) {
    const platformAdmin = (await getPlatformRoles()).find(role => role.isSuperAdmin);
    if (platformAdmin) {
      await createUserRole({ userId: insertedUser.id, roleId: platformAdmin.id });
    }

    const ownerRole = await getRoleByName(orgId, "owner") ?? await getRoleByName(orgId, "admin");
    if (ownerRole) {
      await createUserRole({ userId: insertedUser.id, roleId: ownerRole.id });
    }
  }

  return insertedUser;
}
