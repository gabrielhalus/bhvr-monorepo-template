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

  // Config
  "config:list",
  "config:update",

  // Invitations
  "invitation:create",
  "invitation:read",
  "invitation:list",
  "invitation:revoke",
  "invitation:delete",

  // Logs
  "log:list",
  "log:delete",

  // Sessions
  "session:list",
  "session:revoke",

  // Cron Tasks
  "cronTask:list",
  "cronTask:read",
  "cronTask:create",
  "cronTask:update",
  "cronTask:delete",
  "cronTask:trigger",
]);
