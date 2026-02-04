import type { RoleRelationKeys } from "~shared/types/db/roles.types";

const rolesRootKey = ["roles"] as const;
const rolesRelationsKey = [...rolesRootKey, "relations"] as const;

export const rolesKeys = {
  all: rolesRootKey,
  list: [...rolesRootKey, "list"] as const,
  paginated: [...rolesRootKey, "paginated"] as const,
  byId: (roleId: number) => [...rolesRootKey, "byId", roleId] as const,
  byName: (roleName: string, includes?: RoleRelationKeys) => [...rolesRootKey, "byName", roleName, includes] as const,
  _relations: rolesRelationsKey,
  relations: (roleIds: number[], include: RoleRelationKeys) => [...rolesRelationsKey, { roleIds, include }] as const,
};
