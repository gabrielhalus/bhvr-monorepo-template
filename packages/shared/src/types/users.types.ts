import type { WithRelations } from "../lib/type-utils";
import type { UsersModel } from "../models/users.model";
import type { UserRelationsSchema } from "../schemas/api/users.schemas";
import type { Role } from "./roles.types";
import type { Token } from "./tokens.types";
import type { z } from "zod";

export type User = typeof UsersModel.$inferSelect;

export type UserRelations = {
  roles: Role[];
  tokens: Token[];
};

export type UserRelationKeys = z.infer<typeof UserRelationsSchema>;

export type UserWithRelations<T extends UserRelationKeys> = WithRelations<User, UserRelations, T>;
