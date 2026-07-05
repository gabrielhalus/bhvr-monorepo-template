import { useQuery } from "@tanstack/react-query";

import { userQueryOptions } from "@/api/users/users.queries";

export function useUser(userId: string) {
  return useQuery({ ...userQueryOptions(userId) });
}
