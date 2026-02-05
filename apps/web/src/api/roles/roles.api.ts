import type { Role } from "~shared/types/db/roles.types";

export type GetRolesResponse = {
  success: true;
  roles: Role[];
};

export async function getAllRoles(): Promise<GetRolesResponse> {
  const response = await fetch("/api/roles?limit=100", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch roles");
  }

  const data = await response.json();
  return { success: true, roles: data.data ?? [] };
}
