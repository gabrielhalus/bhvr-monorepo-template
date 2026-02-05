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
  roleIds: arrayParam(z.coerce.number()).optional(),
  include: arrayParam(z.enum(RoleRelationKey)),
});

/**
 * Schema for creating a role
 */
export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, "Must start with a letter and contain only lowercase letters, numbers, and underscores"),
  index: z.number().int().min(0),
  isDefault: z.boolean().optional().default(false),
});
