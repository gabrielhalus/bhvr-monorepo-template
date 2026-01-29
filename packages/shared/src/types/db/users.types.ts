import type { WithRelations } from "~shared/lib/type-utils";
import type { UsersModel } from "~shared/models/users.model";
import type { UserRelationsSchema } from "~shared/schemas/api/users.schemas";
import type { Role } from "~shared/types/db/roles.types";
import type { Token } from "~shared/types/db/tokens.types";
import type { z } from "zod";

export type User = typeof UsersModel.$inferSelect;

export type UserRelations = {
  roles: Role[];
  tokens: Token[];
};

export type UserRelationKey = z.infer<typeof UserRelationsSchema>[number];

export type UserWithRelations<T extends UserRelationKey[]> = WithRelations<User, UserRelations, T>;
