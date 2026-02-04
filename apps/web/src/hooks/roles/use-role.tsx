import { useQuery } from "@tanstack/react-query";

import { roleQueryOptions } from "@/api/roles/roles.queries";

export function useRole(roleName: string) {
  return useQuery({ ...roleQueryOptions(roleName) });
}
