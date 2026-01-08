import { z } from "zod";

export const PermissionSchema = z.enum([
  // UsersModel
  "user:create",
  "user:read",
  "user:list",
  "user:update",
  "user:delete",

  // RolesModel
  "role:create",
  "role:read",
  "role:list",
  "role:update",
  "role:delete",

  // User-roles
  "userRole:create",
  "userRole:delete",

  // Runtime-config
  "runtimeConfig:list",
  "runtimeConfig:update",
]);
