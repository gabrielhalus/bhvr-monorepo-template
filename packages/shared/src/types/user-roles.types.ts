import type { UserRolesModel } from "@/models/user-roles.model";

export type UserRole = typeof UserRolesModel.$inferSelect;
