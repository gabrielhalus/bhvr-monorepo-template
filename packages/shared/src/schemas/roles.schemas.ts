import type { RoleRelations } from "../types/roles.types";

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { arrayParam } from "../lib/helpers";
import { Roles } from "../models/roles.model";

/**
 * Schemas for roles
 */
export const RoleSchema = createSelectSchema(Roles);

/**
 * Role relation keys
 */
const roleRelationKeys = ["members", "permissions", "policies"] as const satisfies (keyof RoleRelations)[];

/**
 * Schema for role relations
 */
export const RoleRelationsSchema = z.array(z.enum(roleRelationKeys));

/**
 * Schema for role relations query
 */
export const RoleRelationsQuerySchema = z.object({
  includes: arrayParam(z.enum(roleRelationKeys)).optional(),
});

/**
 * Schema for inserting a new role
 */
export const InsertRoleSchema = createInsertSchema(Roles).omit({ id: true, createdAt: true, updatedAt: true, verifiedAt: true });

/**
 * Schema for updating a role
 */
export const UpdateRoleSchema = z.object({
  label: z.string(),
  description: z.string().nullable(),
});
