import { createSelectSchema } from "drizzle-zod";

import { UserRoles } from "../../models/user-roles.model";

/**
 * Schema for user-roles
 */
export const UserRoleSchema = createSelectSchema(UserRoles);

