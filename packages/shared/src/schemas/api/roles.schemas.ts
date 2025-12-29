import type { RoleRelations } from "../../types/roles.types";

import { z } from "zod";

import { arrayParam } from "../../lib/helpers";

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
 * Schema for updating a role
 */
export const UpdateRoleSchema = z.object({
  label: z.string(),
  description: z.string().nullable(),
});

