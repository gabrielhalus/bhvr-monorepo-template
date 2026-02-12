import type { PaginatedResponse, PaginationQuery } from "../schemas/api/pagination.schemas";
import type { InsertAuditLogSchema } from "../schemas/db/audit-logs.schemas";
import type { AuditLog, AuditLogAction, AuditTargetType } from "../types/db/audit-logs.types";
import type { z } from "zod";

import { and, asc, count, desc, eq, ilike, isNotNull, or } from "drizzle-orm";

import { drizzle } from "../drizzle";
import { AuditLogsModel } from "../models/audit-logs.model";
import { createPaginatedResponse } from "../schemas/api/pagination.schemas";

// ============================================================================
// Core CRUD Operations
// ============================================================================

/**
 * Create an audit log entry.
 * @param log - The audit log data to insert.
 * @returns The created audit log.
 */
export async function createAuditLog(log: z.infer<typeof InsertAuditLogSchema>): Promise<AuditLog> {
  const [insertedLog] = await drizzle
    .insert(AuditLogsModel)
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
export async function getAuditLogsByActor(actorId: string, limit = 100): Promise<AuditLog[]> {
  return drizzle
    .select()
    .from(AuditLogsModel)
    .where(or(
      eq(AuditLogsModel.actorId, actorId),
      eq(AuditLogsModel.impersonatorId, actorId),
    ))
    .orderBy(desc(AuditLogsModel.createdAt))
    .limit(limit);
}

/**
 * Get audit logs by target ID and type.
 * @param targetId - The ID of the target resource.
 * @param targetType - The type of target resource.
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs.
 */
export async function getAuditLogsByTarget(
  targetId: string,
  targetType?: AuditTargetType,
  limit = 100,
): Promise<AuditLog[]> {
  const conditions = [eq(AuditLogsModel.targetId, targetId)];
  if (targetType) {
    conditions.push(eq(AuditLogsModel.targetType, targetType));
  }

  return drizzle
    .select()
    .from(AuditLogsModel)
    .where(and(...conditions))
    .orderBy(desc(AuditLogsModel.createdAt))
    .limit(limit);
}

/**
 * Get audit logs by action type.
 * @param action - The action type to filter by.
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs.
 */
export async function getAuditLogsByAction(action: AuditLogAction, limit = 100): Promise<AuditLog[]> {
  return drizzle
    .select()
    .from(AuditLogsModel)
    .where(eq(AuditLogsModel.action, action))
    .orderBy(desc(AuditLogsModel.createdAt))
    .limit(limit);
}

/**
 * Get all impersonated actions (where impersonatorId is set).
 * @param limit - Maximum number of logs to return.
 * @returns List of audit logs for impersonated actions.
 */
export async function getImpersonatedActions(limit = 100): Promise<AuditLog[]> {
  return drizzle
    .select()
    .from(AuditLogsModel)
    .where(and(
      // impersonatorId is not null - this is a SQL expression
      // Using a raw check for NOT NULL
    ))
    .orderBy(desc(AuditLogsModel.createdAt))
    .limit(limit);
}

// ============================================================================
// Session Context Type
// ============================================================================

export type AuditContext = {
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
  ctx: Omit<AuditContext, "actorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Omit<AuditContext, "actorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Omit<AuditContext, "actorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
export async function logLogout(ctx: AuditContext): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Omit<AuditContext, "actorId" | "impersonatorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Omit<AuditContext, "actorId" | "impersonatorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  changes?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  changes?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  changes?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Omit<AuditContext, "actorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  oldValue?: unknown,
  newValue?: unknown,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Omit<AuditContext, "actorId">,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  roleName?: string,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: Partial<AuditContext>,
  metadata?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  action: AuditLogAction;
  ctx: AuditContext;
  targetId?: string;
  targetType?: AuditTargetType;
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
}: LogActionParams): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  metadata?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  resource?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  resource?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  filters?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  filters?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  filters?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
export async function logAuditLogList(
  ctx: AuditContext,
  filters?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
    action: "auditLog:list",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "auditLog",
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
 * Log user read (viewing user details).
 */
export async function logUserRead(
  userId: string,
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
  ctx: AuditContext,
  filters?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
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
export async function logAuditLogExport(
  ctx: AuditContext,
  filters?: Record<string, unknown>,
): Promise<AuditLog> {
  return createAuditLog({
    action: "auditLog:export",
    actorId: ctx.actorId,
    impersonatorId: ctx.impersonatorId,
    targetType: "auditLog",
    metadata: filters ? JSON.stringify({ filters }) : undefined,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Log account deletion (self-service).
 */
export async function logAccountDelete(
  ctx: AuditContext,
): Promise<AuditLog> {
  return createAuditLog({
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
export async function deleteAllAuditLogs(): Promise<void> {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await drizzle.delete(AuditLogsModel);
}

// ============================================================================
// Paginated Queries
// ============================================================================

export type AuditLogsPaginatedQuery = PaginationQuery & {
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
export async function getAuditLogsPaginated(
  query: AuditLogsPaginatedQuery,
): Promise<PaginatedResponse<AuditLog>> {
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
    action: AuditLogsModel.action,
    actorId: AuditLogsModel.actorId,
    targetId: AuditLogsModel.targetId,
    targetType: AuditLogsModel.targetType,
    ip: AuditLogsModel.ip,
    createdAt: AuditLogsModel.createdAt,
  };

  const conditions = [];

  if (action) {
    conditions.push(eq(AuditLogsModel.action, action));
  }

  if (actionCategory) {
    conditions.push(ilike(AuditLogsModel.action, `${actionCategory}:%`));
  }

  if (actorId) {
    conditions.push(eq(AuditLogsModel.actorId, actorId));
  }

  if (targetId) {
    conditions.push(eq(AuditLogsModel.targetId, targetId));
  }

  if (targetType) {
    conditions.push(eq(AuditLogsModel.targetType, targetType));
  }

  if (includeImpersonated) {
    conditions.push(isNotNull(AuditLogsModel.impersonatorId));
  }

  if (search) {
    conditions.push(
      or(
        ilike(AuditLogsModel.action, `%${search}%`),
        ilike(AuditLogsModel.actorId, `%${search}%`),
        ilike(AuditLogsModel.targetId, `%${search}%`),
        ilike(AuditLogsModel.ip, `%${search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sortBy && sortableColumns[sortBy as keyof typeof sortableColumns]
    ? sortableColumns[sortBy as keyof typeof sortableColumns]
    : AuditLogsModel.createdAt;

  const countQuery = drizzle
    .select({ count: count() })
    .from(AuditLogsModel);

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [countResult] = await countQuery;
  const total = countResult?.count ?? 0;

  const dataQuery = drizzle
    .select()
    .from(AuditLogsModel);

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
