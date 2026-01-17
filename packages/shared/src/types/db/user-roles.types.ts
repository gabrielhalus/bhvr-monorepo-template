import type { UserRolesModel } from "~shared/models/user-roles.model";

export type UserRole = typeof UserRolesModel.$inferSelect;
