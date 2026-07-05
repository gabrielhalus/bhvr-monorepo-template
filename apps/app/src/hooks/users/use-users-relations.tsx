import type { UserRelationKey } from "~shared/types/db/users.types";

import { useQuery } from "@tanstack/react-query";

import { usersRelationsQueryOptions } from "@/api/users/users.queries";

export function useUsersRelations(userIds: string[], include: UserRelationKey[]) {
  return useQuery({ ...usersRelationsQueryOptions(userIds, include) });
}
