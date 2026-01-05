import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { RolesModel } from "~shared/models/roles.model";

/**
 * Schemas for roles
 */
export const RoleSchema = createSelectSchema(RolesModel);

/**
 * Schema for inserting a new role
 */
export const InsertRoleSchema = createInsertSchema(RolesModel).omit({ id: true, createdAt: true, updatedAt: true });
