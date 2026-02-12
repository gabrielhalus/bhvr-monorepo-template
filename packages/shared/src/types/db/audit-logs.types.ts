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
  | "auth:token_revoke"
  | "auth:session_expired"
  // Impersonation actions
  | "impersonation:start"
  | "impersonation:stop"
  // User management actions
  | "user:create"
  | "user:read"
  | "user:list"
  | "user:update"
  | "user:delete"
  | "user:password_reset"
  | "user:roles_update"
  | "user:export"
  // Account actions (self-service)
  | "account:update"
  | "account:password_change"
  | "account:delete"
  // Role management actions
  | "role:create"
  | "role:read"
  | "role:list"
  | "role:update"
  | "role:delete"
  | "role:members_add"
  | "role:members_remove"
  // Invitation actions
  | "invitation:create"
  | "invitation:read"
  | "invitation:list"
  | "invitation:accept"
  | "invitation:revoke"
  | "invitation:delete"
  | "invitation:resend"
  // Config actions
  | "config:read"
  | "config:list"
  | "config:update"
  // Audit log actions
  | "auditLog:list"
  | "auditLog:delete"
  | "auditLog:export"
  // Permission actions
  | "permission:check"
  | "permission:denied"
  // System actions
  | "system:error"
  | "system:startup"
  | "system:shutdown";

/** Target resource types */
export type AuditTargetType =
  | "user"
  | "role"
  | "invitation"
  | "config"
  | "auditLog"
  | "permission"
  | "session"
  | "system";
