import type { QueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type { Role } from "~shared/types/db/roles.types";

import { api } from "~react/lib/http";
import type { UpdateRoleSchema } from "~shared/schemas/api/roles.schemas";

import { rolesKeys } from "./roles.keys";

type UpdateRoleData = z.infer<typeof UpdateRoleSchema>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function updateRole(id: number, data: UpdateRoleData) {
  const res = await api.roles[":id{[0-9]+}"].$put({
    param: { id: String(id) },
    json: data,
  });

  if (!res.ok) {
    throw new Error("Failed to update role");
  }

  return res.json();
}

async function deleteRole(id: number) {
  const res = await api.roles[":id{[0-9]+}"].$delete({
    param: { id: String(id) },
  });

  if (!res.ok) {
    throw new Error("Failed to delete role");
  }

  return res.json();
}

async function assignRoleMembers(roleId: number, userIds: string[]) {
  const res = await api.roles[":id{[0-9]+}"].members.$post({
    param: { id: String(roleId) },
    json: { userIds },
  });

  if (!res.ok) {
    throw new Error("Failed to assign users to role");
  }

  return res.json();
}

async function removeRoleMembers(roleId: number, userIds: string[]) {
  const res = await api.roles[":id{[0-9]+}"].members.$delete({
    param: { id: String(roleId) },
    json: { userIds },
  });

  if (!res.ok) {
    throw new Error("Failed to remove users from role");
  }

  return res.json();
}

// ============================================================================
// Mutation Options
// ============================================================================

export function updateRoleMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleData }) => updateRole(id, data),
    onSuccess: (_data: { success: true; role: Role }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  };
}

export function deleteRoleMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  };
}

export function assignRoleMembersMutationOptions(queryClient: QueryClient, roleName: string) {
  return {
    mutationFn: ({ roleId, userIds }: { roleId: number; userIds: string[] }) =>
      assignRoleMembers(roleId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.byName(roleName, ["members"]) });
      queryClient.invalidateQueries({ queryKey: rolesKeys._relations });
    },
  };
}

export function removeRoleMembersMutationOptions(queryClient: QueryClient, roleName: string) {
  return {
    mutationFn: ({ roleId, userIds }: { roleId: number; userIds: string[] }) =>
      removeRoleMembers(roleId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.byName(roleName, ["members"]) });
      queryClient.invalidateQueries({ queryKey: rolesKeys._relations });
    },
  };
}
