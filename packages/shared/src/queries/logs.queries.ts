import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { InsertLogSchema } from "../schemas/db/logs.schemas";
import type { Log, LogAction, LogTargetType } from "../types/db/logs.types";
import type { z } from "zod";

import { and, asc, count, desc, eq, ilike, isNotNull, or } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { LogsModel } from "../models/logs.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Create an audit log entry.
 * @param log - The audit log data to insert.
 * @returns The created audit log.
 */
export async function createLog(log: z.infer<typeof InsertLogSchema>): Promise<Log> {
  const [insertedLog] = await drizzle
    .insert(LogsModel)
    .values(log)
    .returning();

  if (!insertedLog) {
    throw new Error("Failed to create audit log");
  }

  return insertedLog;
}

/**
 * Get audit logs by actor ID (includes logs where user was actor or impersonator).
 * @param actorId - The ID of the actor.
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs.
 */
export async function getLogsByActor(actorId: string, limit = 100): Promise<Log[]> {
  return drizzle
    .select()
    .from(LogsModel)
    .where(or(
      eq(LogsModel.actorId, actorId),
      eq(LogsModel.impersonatorId, actorId),
    ))
    .orderBy(desc(LogsModel.createdAt))
    .limit(limit);
}

/**
 * Get audit logs by target ID and type.
 * @param targetId - The ID of the target resource.
 * @param targetType - The type of target resource.
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs.
 */
export async function getLogsByTarget(
  targetId: string,
  targetType?: LogTargetType,
  limit = 100,
): Promise<Log[]> {
  const conditions = [eq(LogsModel.targetId, targetId)];
  if (targetType) {
    conditions.push(eq(LogsModel.targetType, targetType));
  }

  return drizzle
    .select()
    .from(LogsModel)
    .where(and(...conditions))
    .orderBy(desc(LogsModel.createdAt))
    .limit(limit);
}

/**
 * Get audit logs by action type.
 * @param action - The action type to filter by.
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs.
 */
export async function getLogsByAction(action: LogAction, limit = 100): Promise<Log[]> {
  return drizzle
    .select()
    .from(LogsModel)
    .where(eq(LogsModel.action, action))
    .orderBy(desc(LogsModel.createdAt))
    .limit(limit);
}

/**
 * Get all impersonated actions (where impersonatorId is set).
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs for impersonated actions.
 */
export async function getImpersonatedActions(limit = 100): Promise<Log[]> {
  return drizzle
    .select()
    .from(LogsModel)
    .where(and(
      // impersonatorId is not null - this is a SQL expression
      // Using a raw check for NOT NULL
    ))
    .orderBy(desc(LogsModel.createdAt))
    .limit(limit);
}

// ============================================================================
// Session Context Type
// ============================================================================

export type LogContext = {
  /** The session user ID (who the system sees as performing the action) */
  actorId: string;
  /** If impersonating, the real admin user's ID */
  impersonatorId?: string;
  /** Client IP address */
  ip?: string;
  /** Client user agent */
  userAgent?: string;
};

// ============================================================================
// Helper Functions for Specific Actions
// ============================================================================

/**
 * Log a user registration.
 */
export async function logRegister(
  userId: string,
  ctx: Omit<LogContext, "actorId">,
): Promise<Log> {
  return createLog({
    action: "auth:register",
    actorId: userId,
    targetId: userId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log a successful login.
 */
export async function logLogin(
  userId: string,
  ctx: Omit<LogContext, "actorId">,
): Promise<Log> {
  return createLog({
    action: "auth:login",
    actorId: userId,
    targetId: userId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log a failed login attempt.
 */
export async function logLoginFailed(
  email: string,
  ctx: Omit<LogContext, "actorId">,
): Promise<Log> {
  return createLog({
    action: "auth:login_failed",
    actorId: "anonymous",
    targetType: "user",
    metadata: JSON.stringify({ email }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log a logout.
 */
export async function logLogout(ctx: LogContext): Promise<Log> {
  return createLog({
    action: "auth:logout",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: ctx.actorId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log impersonation start.
 */
export async function logImpersonationStart(
  impersonatorId: string,
  targetUserId: string,
  ctx: Omit<LogContext, "actorId" | "impersonatorId">,
): Promise<Log> {
  return createLog({
    action: "impersonation:start",
    actorId: impersonatorId,
    targetId: targetUserId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log impersonation stop.
 */
export async function logImpersonationStop(
  impersonatorId: string,
  impersonatedUserId: string,
  ctx: Omit<LogContext, "actorId" | "impersonatorId">,
): Promise<Log> {
  return createLog({
    action: "impersonation:stop",
    actorId: impersonatorId,
    targetId: impersonatedUserId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log account update (self-service).
 */
export async function logAccountUpdate(
  ctx: LogContext,
  changes?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "account:update",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: ctx.actorId,
    targetType: "user",
    metadata: changes ? JSON.stringify({ changes }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user update (admin action).
 */
export async function logUserUpdate(
  targetUserId: string,
  ctx: LogContext,
  changes?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "user:update",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: targetUserId,
    targetType: "user",
    metadata: changes ? JSON.stringify({ changes }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user deletion.
 */
export async function logUserDelete(
  targetUserId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "user:delete",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: targetUserId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user roles update.
 */
export async function logUserRolesUpdate(
  targetUserId: string,
  newRoleIds: number[],
  previousRoleIds: number[],
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "user:roles_update",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: targetUserId,
    targetType: "user",
    metadata: JSON.stringify({ newRoleIds, previousRoleIds }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log password reset (admin action on another user).
 */
export async function logPasswordReset(
  targetUserId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "user:password_reset",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: targetUserId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log role update.
 */
export async function logRoleUpdate(
  roleId: string,
  ctx: LogContext,
  changes?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "role:update",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: roleId,
    targetType: "role",
    metadata: changes ? JSON.stringify({ changes }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log role deletion.
 */
export async function logRoleDelete(
  roleId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "role:delete",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: roleId,
    targetType: "role",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log adding members to a role.
 */
export async function logRoleMembersAdd(
  roleId: string,
  userIds: string[],
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "role:members_add",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: roleId,
    targetType: "role",
    metadata: JSON.stringify({ userIds }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log removing members from a role.
 */
export async function logRoleMembersRemove(
  roleId: string,
  userIds: string[],
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "role:members_remove",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: roleId,
    targetType: "role",
    metadata: JSON.stringify({ userIds }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation creation.
 */
export async function logInvitationCreate(
  invitationId: string,
  email: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "invitation:create",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: invitationId,
    targetType: "invitation",
    metadata: JSON.stringify({ email }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation acceptance.
 */
export async function logInvitationAccept(
  invitationId: string,
  userId: string,
  ctx: Omit<LogContext, "actorId">,
): Promise<Log> {
  return createLog({
    action: "invitation:accept",
    actorId: userId,
    targetId: invitationId,
    targetType: "invitation",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation revocation.
 */
export async function logInvitationRevoke(
  invitationId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "invitation:revoke",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: invitationId,
    targetType: "invitation",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation deletion.
 */
export async function logInvitationDelete(
  invitationId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "invitation:delete",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: invitationId,
    targetType: "invitation",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log config update.
 */
export async function logConfigUpdate(
  configKey: string,
  ctx: LogContext,
  oldValue?: unknown,
  newValue?: unknown,
): Promise<Log> {
  return createLog({
    action: "config:update",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: configKey,
    targetType: "config",
    metadata: JSON.stringify({ oldValue, newValue }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log token refresh.
 */
export async function logTokenRefresh(
  userId: string,
  ctx: Omit<LogContext, "actorId">,
): Promise<Log> {
  return createLog({
    action: "auth:token_refresh",
    actorId: userId,
    targetId: userId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log account password change (self-service).
 */
export async function logAccountPasswordChange(
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "account:password_change",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: ctx.actorId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log role creation.
 */
export async function logRoleCreate(
  roleId: string,
  ctx: LogContext,
  roleName?: string,
): Promise<Log> {
  return createLog({
    action: "role:create",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: roleId,
    targetType: "role",
    metadata: roleName ? JSON.stringify({ name: roleName }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log system error.
 */
export async function logSystemError(
  error: string,
  ctx: Partial<LogContext>,
  metadata?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "system:error",
    actorId: ctx.actorId ?? "system",
    impersonatorId: ctx.impersonatorId,
    targetType: "system",
    metadata: JSON.stringify({ error, ...metadata }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

// ============================================================================
// Generic Action Logging
// ============================================================================

export type LogActionParams = {
  action: LogAction;
  ctx: LogContext;
  targetId?: string;
  targetType?: LogTargetType;
  metadata?: Record<string, unknown>;
};

/**
 * Generic function to log any action.
 * Use this for custom or less common actions.
 */
export async function logAction({
  action,
  ctx,
  targetId,
  targetType,
  metadata,
}: LogActionParams): Promise<Log> {
  return createLog({
    action,
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId,
    targetType,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user creation (admin action).
 */
export async function logUserCreate(
  userId: string,
  ctx: LogContext,
  metadata?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "user:create",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: userId,
    targetType: "user",
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log permission denied.
 */
export async function logPermissionDenied(
  permission: string,
  ctx: LogContext,
  resource?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "permission:denied",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "permission",
    metadata: JSON.stringify({ permission, resource }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log permission check.
 */
export async function logPermissionCheck(
  permission: string,
  allowed: boolean,
  ctx: LogContext,
  resource?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "permission:check",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "permission",
    metadata: JSON.stringify({ permission, allowed, resource }),
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user list access.
 */
export async function logUserList(
  ctx: LogContext,
  filters?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "user:list",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "user",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log role list access.
 */
export async function logRoleList(
  ctx: LogContext,
  filters?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "role:list",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "role",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation list access.
 */
export async function logInvitationList(
  ctx: LogContext,
  filters?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "invitation:list",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "invitation",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log audit log list access.
 */
export async function logLogList(
  ctx: LogContext,
  filters?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "log:list",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "log",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation resend.
 */
export async function logInvitationResend(
  invitationId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "invitation:resend",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: invitationId,
    targetType: "invitation",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log token revocation.
 */
export async function logTokenRevoke(
  tokenId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "auth:token_revoke",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: tokenId,
    targetType: "session",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log revocation of all sessions for a user.
 * @param targetUserId - The user whose sessions were revoked.
 * @param ctx - The audit context.
 */
export async function logSessionRevokeAll(
  targetUserId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "auth:session_revoke_all",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: targetUserId,
    targetType: "session",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user read (viewing user details).
 */
export async function logUserRead(
  userId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "user:read",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: userId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log role read (viewing role details).
 */
export async function logRoleRead(
  roleId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "role:read",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: roleId,
    targetType: "role",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log invitation read (viewing invitation details).
 */
export async function logInvitationRead(
  invitationId: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "invitation:read",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: invitationId,
    targetType: "invitation",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log config read.
 */
export async function logConfigRead(
  configKey: string,
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "config:read",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: configKey,
    targetType: "config",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log config list.
 */
export async function logConfigList(
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "config:list",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "config",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log user data export.
 */
export async function logUserExport(
  ctx: LogContext,
  filters?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "user:export",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "user",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log audit log export.
 */
export async function logLogExport(
  ctx: LogContext,
  filters?: Record<string, unknown>,
): Promise<Log> {
  return createLog({
    action: "log:export",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "log",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log account deletion (self-service).
 */
export async function logAccountDelete(
  ctx: LogContext,
): Promise<Log> {
  return createLog({
    action: "account:delete",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetId: ctx.actorId,
    targetType: "user",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Delete all audit logs.
 */
export async function deleteAllLogs(): Promise<void> {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await drizzle.delete(LogsModel);
}

// ============================================================================
// Paginated Queries
// ============================================================================

export type LogsPaginatedQuery = PaginationQuery & {
  action?: string;
  actionCategory?: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  includeImpersonated?: boolean;
};

/**
 * Get paginated audit logs with filtering options.
 */
export async function getLogsPaginated(
  query: LogsPaginatedQuery,
): Promise<PaginatedResponse<Log>> {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
    action,
    actionCategory,
    actorId,
    targetId,
    targetType,
    includeImpersonated,
  } = query;

  const sortableColumns = {
    action: LogsModel.action,
    actorId: LogsModel.actorId,
    targetId: LogsModel.targetId,
    targetType: LogsModel.targetType,
    ip: LogsModel.ip,
    createdAt: LogsModel.createdAt,
  };

  const conditions = [];

  if (action) {
    conditions.push(eq(LogsModel.action, action));
  }

  if (actionCategory) {
    conditions.push(ilike(LogsModel.action, `${actionCategory}:%`));
  }

  if (actorId) {
    conditions.push(eq(LogsModel.actorId, actorId));
  }

  if (targetId) {
    conditions.push(eq(LogsModel.targetId, targetId));
  }

  if (targetType) {
    conditions.push(eq(LogsModel.targetType, targetType));
  }

  if (includeImpersonated) {
    conditions.push(isNotNull(LogsModel.impersonatorId));
  }

  if (search) {
    conditions.push(
      or(
        ilike(LogsModel.action, `%${search}%`),
        ilike(LogsModel.actorId, `%${search}%`),
        ilike(LogsModel.targetId, `%${search}%`),
        ilike(LogsModel.ip, `%${search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sortBy && sortableColumns[sortBy as keyof typeof sortableColumns]
    ? sortableColumns[sortBy as keyof typeof sortableColumns]
    : LogsModel.createdAt;

  const countQuery = drizzle
    .select({ count: count() })
    .from(LogsModel);

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(LogsModel);

  if (whereClause) {
    dataQuery.where(whereClause);
  }

  if (sortOrder === "asc") {
    dataQuery.orderBy(asc(sortColumn));
  } else {
    dataQuery.orderBy(desc(sortColumn));
  }

  dataQuery.limit(limit).offset((page - 1) * limit);

  const data = await dataQuery;

  return createPaginatedResponse(data, total, page, limit);
}
