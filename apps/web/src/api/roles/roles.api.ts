import type { RoleRelationKeys } from "~shared/types/db/roles.types";
import type { PaginationParams } from "~react/query/paginated/types";

import { api } from "~react/lib/http";

export async function fetchPaginatedRoles(params: PaginationParams) {
  const res = await api.roles.$get({
    query: {
      page: String(params.page),
      limit: String(params.limit),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch roles");
  }

  return res.json();
}

export async function fetchAllRoles() {
  const res = await api.roles.$get({ query: { limit: "100" } });

  if (!res.ok) {
    throw new Error("Failed to fetch roles");
  }

  const result = await res.json();
  return { ...result, roles: result.data };
}

export async function fetchRole(roleName: string) {
  const res = await api.roles[":name"].$get({
    param: { name: roleName },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch role");
  }

  return res.json();
}

export async function fetchRolesRelations(roleIds: number[], include: RoleRelationKeys) {
  const res = await api.roles.relations.$get({
    query: {
      roleIds: roleIds.map(String),
      include,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch roles relations");
  }

  return res.json();
}
