import type { UserRolesModel } from "~shared/db/models/user-roles.model";

export type UserRole = typeof UserRolesModel.$inferSelect;
