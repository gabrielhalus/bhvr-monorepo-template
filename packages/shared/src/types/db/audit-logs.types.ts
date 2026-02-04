import type { AuditLogsModel } from "~shared/models/audit-logs.model";

export type AuditLog = typeof AuditLogsModel.$inferSelect;

/** Supported audit log action categories and types */
export type AuditLogAction =
  // Authentication actions
  | "auth:register"
  | "auth:login"
  | "auth:login_failed"
  | "auth:logout"
  | "auth:token_refresh"
  // Impersonation actions
  | "impersonation:start"
  | "impersonation:stop"
  // User management actions
  | "user:create"
  | "user:read"
  | "user:update"
  | "user:delete"
  | "user:password_reset"
  // Account actions (self-service)
  | "account:update"
  | "account:password_change"
  // Role management actions
  | "role:create"
  | "role:update"
  | "role:delete"
  | "role:members_add"
  | "role:members_remove"
  // Invitation actions
  | "invitation:create"
  | "invitation:accept"
  | "invitation:revoke"
  | "invitation:delete"
  // Config actions
  | "config:update"
  // System actions
  | "system:error";

/** Target resource types */
export type AuditTargetType =
  | "user"
  | "role"
  | "invitation"
  | "config"
  | "system";
