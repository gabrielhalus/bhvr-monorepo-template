import { queryOptions } from "@tanstack/react-query";

import { getAllRoles } from "./roles.api";

export const allRolesQueryOptions = queryOptions({
  queryKey: ["roles", "all"],
  queryFn: getAllRoles,
  staleTime: 1000 * 60 * 5,
});
