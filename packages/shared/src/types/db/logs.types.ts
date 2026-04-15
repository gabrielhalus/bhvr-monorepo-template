import type { LogsModel } from "~shared/models/logs.model";

export type Log = typeof LogsModel.$inferSelect;

/** Supported log action categories and types */
export type LogAction
  // Authentication actions
  = | "auth:register"
    | "auth:login"
    | "auth:login_failed"
    | "auth:logout"
    | "auth:token_refresh"
    | "auth:token_revoke"
    | "auth:session_revoke_all"
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
  // Log actions
    | "log:list"
    | "log:delete"
    | "log:export"
  // Permission actions
    | "permission:check"
    | "permission:denied"
  // System actions
    | "system:error"
    | "system:startup"
    | "system:shutdown";

/** Target resource types */
export type LogTargetType
  = | "user"
    | "role"
    | "invitation"
    | "config"
    | "log"
    | "permission"
    | "session"
    | "system";
