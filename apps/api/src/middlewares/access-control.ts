import type { AppContext } from "@/utils/hono";
import type { Permission } from "@bunstack/shared/types/permissions.types";

import { factory } from "@/utils/hono";
import { isAuthorized } from "@bunstack/auth";

/**
 * Core authorization middleware that checks permissions
 * @param permission - The permission to check.
 * @param getResource - The resource to check.
 * @returns The middleware.
 */
export function requirePermissionFactory(permission: Permission, getResource?: (c: AppContext) => Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined) {
  return factory.createMiddleware(async (c, next) => {
    const { user } = c.get("sessionContext");

    const resource = typeof getResource === "function" ? await getResource(c) : undefined;

    const allowed = isAuthorized(permission, user, resource);
    if (!allowed) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  });
}
