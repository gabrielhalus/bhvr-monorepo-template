import type { UserRolesModel } from "@bunstack/shared/models/user-roles.model";

export type UserRole = typeof UserRolesModel.$inferSelect;
