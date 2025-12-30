import { createSelectSchema } from "drizzle-zod";

import { UserRolesModel } from "../../models/user-roles.model";

/**
 * Schema for user-roles
 */
export const UserRoleSchema = createSelectSchema(UserRolesModel);

