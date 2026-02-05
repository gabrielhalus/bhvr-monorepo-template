import { useQuery } from "@tanstack/react-query";

import { allRolesQueryOptions } from "@/api/roles/roles.queries";

export function useRoles() {
  return useQuery(allRolesQueryOptions);
}
