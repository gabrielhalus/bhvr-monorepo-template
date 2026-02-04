import type { UserRelationKey } from "~shared/types/db/users.types";

import { api } from "~react/lib/http";

export async function fetchUsersRelations(userIds: string[], include: UserRelationKey[]) {
  const res = await api.users.relations.$get({
    query: {
      userIds,
      include,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users relations");
  }

  return res.json();
}
