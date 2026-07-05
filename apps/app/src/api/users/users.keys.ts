import type { UserRelationKey } from "~shared/types/db/users.types";

const usersRootKey = ["users"] as const;

export const usersKeys = {
  all: usersRootKey,
  paginated: [...usersRootKey, "paginated"] as const,
  byId: (userId: string) => ["users", "byId", userId] as const,
  relations: (userIds: string[], include: UserRelationKey[]) => ["users", "relations", { userIds, include }] as const,
  relationCounts: (userIds: string[], include: UserRelationKey[]) => ["users", "relations", "count", { userIds, include }] as const,
};
