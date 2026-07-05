import type { UserRelationKey } from "~shared/types/db/users.types";

import { api, ApiError } from "@/lib/http";

export async function fetchUsersRelations(userIds: string[], include: UserRelationKey[]) {
  const res = await api.users.relations.$get({
    query: {
      userIds,
      include,
    },
  });

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  return res.json();
}
