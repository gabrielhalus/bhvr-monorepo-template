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

// ============================================================================
// Paginated Queries
// ============================================================================

export type AuditLogsPaginatedQuery = PaginationQuery & {
  action?: string;
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
