import type { QueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type { User } from "~shared/types/db/users.types";

import { api } from "~react/lib/http";
import { authQueryOptions } from "~react/queries/auth";
import type { UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

import { usersKeys } from "./users.keys";

type UpdateUserData = z.infer<typeof UpdateAccountSchema>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function updateUser(id: string, data: UpdateUserData) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].$put({
    param: { id },
    json: data,
  });

  if (!res.ok) {
    throw new Error("Failed to update user");
  }

  return res.json();
}

async function deleteUser(id: string) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].$delete({
    param: { id },
  });

  if (!res.ok) {
    throw new Error("Failed to delete user");
  }

  return res.json();
}

async function resetUserPassword(id: string) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"]["reset-password"].$post({
    param: { id },
  });

  if (!res.ok) {
    throw new Error("Failed to reset password");
  }

  return res.json();
}

async function updateAccount(data: UpdateUserData) {
  const res = await api.auth.account.$put({ json: data });

  if (!res.ok) {
    throw new Error("Failed to update account");
  }

  return res.json();
}

async function impersonateUser(id: string) {
  const res = await api.auth.impersonate[":id{^[a-zA-Z0-9-]{21}$}"].$post({
    param: { id },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error("error" in data ? String(data.error) : "Failed to impersonate user");
  }

  return res.json();
}

async function stopImpersonation() {
  const res = await api.auth["stop-impersonation"].$post();

  if (!res.ok) {
    throw new Error("Failed to stop impersonation");
  }

  return res.json();
}

async function updateUserRoles(id: string, roleIds: number[]) {
  const res = await api.users[":id{^[a-zA-Z0-9-]{21}$}"].roles.$put({
    param: { id },
    json: { roleIds },
  });

  if (!res.ok) {
    throw new Error("Failed to update user roles");
  }

  return res.json();
}

// ============================================================================
// Mutation Options
// ============================================================================

export function updateUserMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => updateUser(id, data),
    onSuccess: (_data: { success: true; user: User }, variables: { id: string; data: UpdateUserData }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
    },
  };
}

export function deleteUserMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_data: { success: true; user: User }, id: string) => {
      queryClient.removeQueries({ queryKey: usersKeys.byId(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
    },
  };
}

export function resetUserPasswordMutationOptions() {
  return {
    mutationFn: (id: string) => resetUserPassword(id),
  };
}

export function updateAccountMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (data: UpdateUserData) => updateAccount(data),
    onSuccess: () => {
      queryClient.refetchQueries(authQueryOptions);
    },
  };
}

export function impersonateUserMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => impersonateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  };
}

export function stopImpersonationMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: () => stopImpersonation(),
    onSuccess: () => {
      queryClient.refetchQueries();
    },
  };
}

export function updateUserRolesMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, roleIds }: { id: string; roleIds: number[] }) => updateUserRoles(id, roleIds),
    onSuccess: (_data: { success: true }, variables: { id: string; roleIds: number[] }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
    },
  };
}
