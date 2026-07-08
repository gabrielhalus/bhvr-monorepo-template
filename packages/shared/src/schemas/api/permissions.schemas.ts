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
   * Domain
   */
  "domain:list",
  "domain:create",
  "domain:delete",

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
   * Organization
   */
  "organization:update",

  /**
   * Role
   */
  "role:create",
  "role:read",
  "role:list",
  "role:update",
  "role:delete",

  /**
   * Translation
   */
  "translation:update",

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

/**
 * Platform-level permissions, checked against platform roles
 * (roles with organizationId NULL) on the /admin surface. Kept as a separate
 * enum so they never appear in org role management UIs.
 */
export const PlatformPermissionSchema = z.enum([
  "platform:organization:list",
  "platform:organization:read",
  "platform:organization:create",
  "platform:organization:update",
  "platform:organization:delete",
  "platform:user:list",
  "platform:user:read",
  "platform:user:update",
  "platform:user:delete",
  "platform:role:list",
  "platform:role:manage",
  "platform:config:list",
  "platform:config:update",
  "platform:flag:list",
  "platform:flag:update",
  "platform:log:list",
  "platform:backup:manage",
  "platform:cron:manage",
  "platform:impersonate",
]);
