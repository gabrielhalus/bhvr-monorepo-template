import type { RoleRelations } from "~shared/types/db/roles.types";

import { z } from "zod";

import { arrayParam } from "~shared/helpers";

/**
 * Role relation keys
 */
const RoleRelationKey = ["members", "permissions", "policies"] as const satisfies (keyof RoleRelations)[];

/**
 * Schema for role relations
 */
export const RoleRelationsSchema = z.array(z.enum(RoleRelationKey));

/**
 * Schema for role relations query
 */
export const RoleRelationsQuerySchema = z.object({
  roleIds: arrayParam(z.number()).optional(),
  include: arrayParam(z.enum(RoleRelationKey)),
});

/**
 * Schema for updating a role
 */
export const UpdateRoleSchema = z.object({
  label: z.string(),
  description: z.string().nullable(),
});
