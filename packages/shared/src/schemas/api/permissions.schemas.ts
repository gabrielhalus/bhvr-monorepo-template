import { z } from "zod";

export const PermissionSchema = z.enum([
  // UsersModel
  "user:create",
  "user:read",
  "user:list",
  "user:update",
  "user:delete",
  "user:impersonate",

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

  // Invitations
  "invitation:create",
  "invitation:read",
  "invitation:list",
  "invitation:revoke",
  "invitation:delete",

  // Audit logs
  "auditLog:list",
  "auditLog:delete",

  // Sessions
  "session:list",
  "session:revoke",
]);
