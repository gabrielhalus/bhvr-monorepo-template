import type { AppContext } from "@/utils/hono";
import type { Permission } from "~shared/types/permissions.types";

import { getClientInfo } from "@/helpers/get-client-info";
import { factory } from "@/utils/hono";
import { isAuthorized } from "~shared/auth";
import { logPermissionDenied } from "~shared/queries/audit-logs.queries";

/**
 * Core authorization middleware that checks permissions
 * @param permission - The permission to check.
 * @param getResource - The resource to check.
 * @returns The middleware.
 */
export function requirePermissionFactory(permission: Permission, getResource?: (c: AppContext) => Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined) {
  return factory.createMiddleware(async (c, next) => {
    const sessionContext = c.get("sessionContext");
    const { user } = sessionContext;

    const resource = typeof getResource === "function" ? await getResource(c) : undefined;

    const allowed = await isAuthorized(permission, user, resource);
    if (!allowed) {
      // Audit log: permission denied
      const clientInfo = getClientInfo(c);
      logPermissionDenied(permission, {
        actorId: user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      }, resource).catch(() => {
        // Silently fail audit logging
      });

      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  });
}
