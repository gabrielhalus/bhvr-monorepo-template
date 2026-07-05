import { z } from "zod";

export const PermissionSchema = z.enum([
  /**
   * Backup
   */
  "backup:list",
  "backup:create",
  "backup:restore",

  /**
   * API key
   */
  "apiKey:list",
  "apiKey:create",
  "apiKey:revoke",

  /**
   * Config
   */
  "config:list",
  "config:update",

  /**
   * Cron Task
   */
  "cronTask:list",
  "cronTask:read",
  "cronTask:create",
  "cronTask:update",
  "cronTask:delete",
  "cronTask:trigger",

  /**
   * Invitation
   */
  "invitation:create",
  "invitation:read",
  "invitation:list",
  "invitation:revoke",
  "invitation:delete",

  /**
   * Log
   */
  "log:list",
  "log:delete",

  /**
   * Role
   */
  "role:create",
  "role:read",
  "role:list",
  "role:update",
  "role:delete",

  /**
   * Session
   */
  "session:list",
  "session:revoke",

  /**
   * User
   */
  "user:create",
  "user:read",
  "user:list",
  "user:update",
  "user:delete",
  "user:impersonate",

  /**
   * User role
   */
  "userRole:create",
  "userRole:delete",
]);
