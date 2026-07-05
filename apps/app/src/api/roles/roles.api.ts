import type { Role } from "~shared/types/db/roles.types";

import { ApiError } from "@/lib/http";

export type GetRolesResponse = {
  success: true;
  roles: Role[];
};

export async function getAllRoles(): Promise<GetRolesResponse> {
  const response = await fetch("/api/roles?limit=100", {
    credentials: "include",
  });

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  const data = await response.json();
  return { success: true, roles: data.data ?? [] };
}
