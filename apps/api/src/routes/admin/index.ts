import { Hono } from "hono";
import { z } from "zod";

import { requirePlatformPermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { FEATURE_FLAGS, FEATURE_FLAGS_MAP } from "~shared/feature-flags.registry";
import { resolveFeatureFlags, setFeatureFlagOverride } from "~shared/queries/feature-flags.queries";
import { getLogsPaginated } from "~shared/queries/logs.queries";
import { getUsersPaginated } from "~shared/queries/users.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";
import { asOrgId } from "~shared/types/org.types";

import { adminOrganizationsRoutes } from "./organizations.routes";

const FlagKeySchema = z.enum(FEATURE_FLAGS.map(f => f.key) as [string, ...string[]]);

const UpdateFlagSchema = z.object({
  key: FlagKeySchema,
  /** null removes the override (back to the default) */
  enabled: z.boolean().nullable(),
  /** omit for a platform-wide override */
  organizationId: z.string().length(21).optional(),
});

const AdminLogsQuerySchema = PaginationQuerySchema.extend({
  action: z.string().optional(),
  actionCategory: z.string().optional(),
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  targetType: z.string().optional(),
  includeImpersonated: z.coerce.boolean().optional().default(false),
});

/**
 * Platform administration surface. Served to the admin app
 * (admin.BASE_DOMAIN); every route requires a platform role.
 */
export const adminRoutes = new Hono()
  // --- All admin routes require authentication with platform roles
  .use(getSessionContext)

  .route("/organizations", adminOrganizationsRoutes)

  /**
   * Feature flag registry with the platform-resolved values
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the registry and resolved platform values
   * @access protected
   * @permission platform:flag:list
   */
  .get("/flags", requirePlatformPermissionFactory("platform:flag:list"), async (c) => {
    const resolved = await resolveFeatureFlags(null);
    const flags = FEATURE_FLAGS.map(entry => ({ ...entry, enabled: resolved[entry.key] }));

    return c.json({ success: true as const, flags });
  })

  /**
   * Set (or clear) a feature flag override, platform-wide or for one org
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @access protected
   * @permission platform:flag:update
   */
  .put("/flags", requirePlatformPermissionFactory("platform:flag:update"), validationMiddleware("json", UpdateFlagSchema), async (c) => {
    const { key, enabled, organizationId } = c.req.valid("json");
    const sessionContext = c.var.sessionContext;

    const entry = FEATURE_FLAGS_MAP.get(key as never);
    if (!entry) {
      return c.json({ success: false as const, error: "Unknown flag" }, 400);
    }

    if (organizationId && entry.scope !== "organization") {
      return c.json({ success: false as const, error: "Platform flags cannot be overridden per organization" }, 400);
    }

    await setFeatureFlagOverride(entry.key, organizationId ? asOrgId(organizationId) : null, enabled, sessionContext.user.id);

    return c.json({ success: true as const });
  })

  /**
   * List every user account on the platform
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated users
   * @access protected
   * @permission platform:user:list
   */
  .get("/users", validationMiddleware("query", PaginationQuerySchema), requirePlatformPermissionFactory("platform:user:list"), async (c) => {
    const { page, limit, sortBy, sortOrder, search } = c.req.valid("query");

    const result = await getUsersPaginated({ page, limit, sortBy, sortOrder, search });

    return c.json({ success: true as const, ...result });
  })

  /**
   * List audit logs across every organization (and platform events)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated logs
   * @access protected
   * @permission platform:log:list
   */
  .get("/logs", validationMiddleware("query", AdminLogsQuerySchema), requirePlatformPermissionFactory("platform:log:list"), async (c) => {
    const { page, limit, sortBy, sortOrder, search, action, actionCategory, actorId, targetId, targetType, includeImpersonated } = c.req.valid("query");

    const result = await getLogsPaginated(null, {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      action,
      actionCategory,
      actorId,
      targetId,
      targetType,
      includeImpersonated,
    });

    return c.json({ success: true as const, ...result });
  });
