import type { WithRelations } from "../lib/type-utils";
import type { Users } from "../models/users.model";
import type { UserRelationsSchema } from "../schemas/users.schemas";
import type { Role } from "./roles.types";
import type { Token } from "./tokens.types";
import type { z } from "zod";

export type User = typeof Users.$inferSelect;

export type UserRelations = {
  roles: Role[];
  tokens: Token[];
};

export type UserRelationKeys = z.infer<typeof UserRelationsSchema>;

export type UserWithRelations<T extends UserRelationKeys> = WithRelations<User, UserRelations, T>;
