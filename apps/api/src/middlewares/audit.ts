import type { AuditContext } from "~shared/queries/audit-logs.queries";
import type { AuditLogAction, AuditTargetType } from "~shared/types/db/audit-logs.types";

import { getClientInfo } from "@/helpers/get-client-info";
import { factory } from "@/utils/hono";
import { logAction } from "~shared/queries/audit-logs.queries";

type MiddlewareContext = Parameters<ReturnType<typeof factory.createMiddleware>>[0];

export type AuditMiddlewareOptions = {
  action: AuditLogAction;
  targetType?: AuditTargetType;
  getTargetId?: (c: MiddlewareContext) => string | undefined;
  getMetadata?: (c: MiddlewareContext) => Record<string, unknown> | undefined | Promise<Record<string, unknown> | undefined>;
  /** If true, log before the handler runs. Default is false (log after). */
  logBefore?: boolean;
};

/**
 * Creates an audit logging middleware that logs actions automatically.
 * Can be used on any route to add audit logging without modifying the handler.
 *
 * @example
 * ```ts
 * .get("/users", auditMiddleware({ action: "user:list", targetType: "user" }), async (c) => { ... })
 * ```
 */
export function auditMiddleware(options: AuditMiddlewareOptions) {
  const { action, targetType, getTargetId, getMetadata, logBefore = false } = options;

  return factory.createMiddleware(async (c, next) => {
    const sessionContext = c.get("sessionContext");
    const clientInfo = getClientInfo(c);

    const ctx: AuditContext = {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    };

    const performLog = async () => {
      const targetId = getTargetId?.(c);
      const metadata = await getMetadata?.(c);

      logAction({
        action,
        ctx,
        targetId,
        targetType,
        metadata,
      }).catch(() => {
        // Silently fail audit logging
      });
    };

    if (logBefore) {
      performLog();
    }

    await next();

    // Only log after if response was successful (2xx status)
    if (!logBefore && c.res.status >= 200 && c.res.status < 300) {
      performLog();
    }
  });
}

/**
 * Pre-configured audit middleware for common list operations.
 */
export function auditList(action: AuditLogAction, targetType: AuditTargetType) {
  return auditMiddleware({
    action,
    targetType,
    getMetadata: (c) => {
      const query = c.req.query();
      return Object.keys(query).length > 0 ? { filters: query } : undefined;
    },
  });
}

/**
 * Pre-configured audit middleware for common read operations.
 */
export function auditRead(action: AuditLogAction, targetType: AuditTargetType, paramName = "id") {
  return auditMiddleware({
    action,
    targetType,
    getTargetId: c => c.req.param(paramName),
  });
}

/**
 * Pre-configured audit middleware for common create operations.
 */
export function auditCreate(action: AuditLogAction, targetType: AuditTargetType) {
  return auditMiddleware({
    action,
    targetType,
    getMetadata: async (c) => {
      try {
        const body = await c.req.json();
        return { data: body };
      } catch {
        return undefined;
      }
    },
  });
}

/**
 * Pre-configured audit middleware for common update operations.
 */
export function auditUpdate(action: AuditLogAction, targetType: AuditTargetType, paramName = "id") {
  return auditMiddleware({
    action,
    targetType,
    getTargetId: c => c.req.param(paramName),
    getMetadata: async (c) => {
      try {
        const body = await c.req.json();
        return { changes: body };
      } catch {
        return undefined;
      }
    },
  });
}

/**
 * Pre-configured audit middleware for common delete operations.
 */
export function auditDelete(action: AuditLogAction, targetType: AuditTargetType, paramName = "id") {
  return auditMiddleware({
    action,
    targetType,
    getTargetId: c => c.req.param(paramName),
  });
}
