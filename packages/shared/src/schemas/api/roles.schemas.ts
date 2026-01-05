import type { RoleRelations } from "~shared/types/db/roles.types";

import { z } from "zod";

import { arrayParam } from "~shared/helpers";

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
