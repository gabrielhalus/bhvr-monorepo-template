import type { RoleRelationKeys } from "~shared/types/db/roles.types";

import { useQuery } from "@tanstack/react-query";

import { rolesRelationsQueryOptions } from "@/api/roles/roles.queries";

export function useRolesRelations(roleIds: number[], include: RoleRelationKeys) {
  return useQuery({ ...rolesRelationsQueryOptions(roleIds, include) });
}
