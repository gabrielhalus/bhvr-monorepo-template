import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { Roles } from "../../models/roles.model";

/**
 * Schemas for roles
 */
export const RoleSchema = createSelectSchema(Roles);

/**
 * Schema for inserting a new role
 */
export const InsertRoleSchema = createInsertSchema(Roles).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true });
