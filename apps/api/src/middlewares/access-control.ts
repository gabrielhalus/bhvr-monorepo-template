import type { AppContext } from "@/utils/hono";
import type { FeatureFlagKey } from "~shared/feature-flags.registry";
import type { OrgId } from "~shared/types/org.types";
import type { Permission, PlatformPermission } from "~shared/types/permissions.types";

import { getClientInfo } from "@/helpers/get-client-info";
import { factory } from "@/utils/hono";
import { isAuthorized } from "~shared/auth";
import { isFeatureEnabled } from "~shared/queries/feature-flags.queries";
import { logPermissionDenied } from "~shared/queries/logs.queries";

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

/**
 * Authorization middleware for the platform (/admin) surface. Checks the
 * user's platform roles: super-admins bypass, other platform roles need the
 * permission explicitly. Org roles never grant platform access.
 * @param permission - The platform permission to check.
 * @returns The middleware.
 */
/**
 * Gate a route behind a feature flag. Disabled features answer 404 — from the
 * outside, a switched-off feature does not exist.
 * @param flag - The feature flag key.
 * @returns The middleware.
 */
export function requireFeatureFactory(flag: FeatureFlagKey) {
  return factory.createMiddleware(async (c, next) => {
    const orgContext = c.get("orgContext");
    const enabled = await isFeatureEnabled(flag, (orgContext?.org.id ?? null) as OrgId | null);

    if (!enabled) {
      return c.json({ success: false, error: "Not Found" }, 404);
    }

    await next();
  });
}

export function requirePlatformPermissionFactory(permission: PlatformPermission) {
  return factory.createMiddleware(async (c, next) => {
    const sessionContext = c.get("sessionContext");
    const { user } = sessionContext;

    const platformRoles = user.roles.filter(role => role.organizationId === null);
    const isSuperAdmin = platformRoles.some(role => role.isSuperAdmin);

    // Non-super-admin platform roles carry platform permissions through the
    // regular role-permission rows (stored as plain strings).
    const allowed = isSuperAdmin || (platformRoles.length > 0 && await isAuthorized(permission as unknown as Permission, { ...user, roles: platformRoles }));

    if (!allowed) {
      const clientInfo = getClientInfo(c);
      logPermissionDenied(permission as unknown as Permission, {
        actorId: user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      }).catch(() => {
        // Silently fail audit logging
      });

      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  });
}
