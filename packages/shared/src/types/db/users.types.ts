import type { WithRelations } from "@bunstack/shared/lib/type-utils";
import type { UsersModel } from "@bunstack/shared/models/users.model";
import type { UserRelationsSchema } from "@bunstack/shared/schemas/api/users.schemas";
import type { Role } from "@bunstack/shared/types/db/roles.types";
import type { Token } from "@bunstack/shared/types/db/tokens.types";
import type { z } from "zod";

export type User = typeof UsersModel.$inferSelect;

export type UserRelations = {
  roles: Role[];
  tokens: Token[];
};

export type UserRelationKeys = z.infer<typeof UserRelationsSchema>;

export type UserWithRelations<T extends UserRelationKeys> = WithRelations<User, UserRelations, T>;
