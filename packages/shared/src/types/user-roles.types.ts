import type { UserRoles } from "@/models/user-roles.model";

export type UserRole = typeof UserRoles.$inferSelect;
