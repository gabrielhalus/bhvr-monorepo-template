import { Hono } from "hono";

import { getClientInfo } from "@/helpers/get-client-info";
import { requirePlatformPermissionFactory } from "@/middlewares/access-control";
import { validationMiddleware } from "@/middlewares/validation";
import { provisionOrganization, teardownOrganization } from "@/services/organizations.service";
import { FEATURE_FLAGS } from "~shared/feature-flags.registry";
import { resolveFeatureFlags } from "~shared/queries/feature-flags.queries";
import { logAction } from "~shared/queries/logs.queries";
import { getOrganizationDomains } from "~shared/queries/organization-domains.queries";
import { getOrganization, getOrganizations, updateOrganization } from "~shared/queries/organizations.queries";
import { getOrgUsersPaginated } from "~shared/queries/users.queries";
import { InsertOrganizationSchema, UpdateOrganizationSchema } from "~shared/schemas/db/organizations.schemas";
import { asOrgId } from "~shared/types/org.types";

export const adminOrganizationsRoutes = new Hono()
  /**
   * List every organization
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the organizations
   * @access protected
   * @permission platform:organization:list
   */
  .get("/", requirePlatformPermissionFactory("platform:organization:list"), async (c) => {
    const organizations = await getOrganizations();
    return c.json({ success: true as const, organizations });
  })

  /**
   * Create an organization (org row + subdomain + template roles)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the created organization
   * @throws {400} If the slug is already taken
   * @access protected
   * @permission platform:organization:create
   */
  .post("/", requirePlatformPermissionFactory("platform:organization:create"), validationMiddleware("json", InsertOrganizationSchema), async (c) => {
    const data = c.req.valid("json");
    const sessionContext = c.var.sessionContext;

    try {
      const organization = await provisionOrganization(data);

      await logAction({
        action: "organization:create",
        ctx: { actorId: sessionContext.user.id, impersonatorId: sessionContext.impersonator?.id, ...getClientInfo(c) },
        targetId: organization.id,
        targetType: "organization",
        metadata: { name: organization.name, slug: organization.slug },
      });

      return c.json({ success: true as const, organization });
    } catch (error) {
      if (error instanceof Error && error.message.includes("organizations_slug_unique")) {
        return c.json({ success: false as const, error: "Slug is already taken" }, 400);
      }
      throw error;
    }
  })

  /**
   * Get an organization with its domains, members and resolved feature flags
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the organization, domains, members and flags
   * @access protected
   * @permission platform:organization:read
   */
  .get("/:id{[a-zA-Z0-9_-]{21}}", requirePlatformPermissionFactory("platform:organization:read"), async (c) => {
    const id = c.req.param("id");

    const organization = await getOrganization(id);
    if (!organization) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    const orgId = asOrgId(organization.id);
    const [domains, members, resolved] = await Promise.all([
      getOrganizationDomains(orgId),
      getOrgUsersPaginated(orgId, { page: 1, limit: 50, sortOrder: "desc" }),
      resolveFeatureFlags(orgId),
    ]);

    // Only organization-scoped flags are overridable per org
    const flags = FEATURE_FLAGS
      .filter(entry => entry.scope === "organization")
      .map(entry => ({ key: entry.key, description: entry.description, enabled: resolved[entry.key] }));

    return c.json({ success: true as const, organization, domains, members: members.data, memberCount: members.pagination.total, flags });
  })

  /**
   * Update an organization
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated organization
   * @access protected
   * @permission platform:organization:update
   */
  .put("/:id{[a-zA-Z0-9_-]{21}}", requirePlatformPermissionFactory("platform:organization:update"), validationMiddleware("json", UpdateOrganizationSchema), async (c) => {
    const id = c.req.param("id");
    const updates = c.req.valid("json");
    const sessionContext = c.var.sessionContext;

    const existing = await getOrganization(id);
    if (!existing) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    const organization = await updateOrganization(asOrgId(id), updates);

    await logAction({
      action: "organization:update",
      ctx: { actorId: sessionContext.user.id, impersonatorId: sessionContext.impersonator?.id, ...getClientInfo(c) },
      targetId: id,
      targetType: "organization",
      metadata: { changes: updates },
    });

    return c.json({ success: true as const, organization });
  })

  /**
   * Delete an organization (org-scoped data cascades; user accounts remain)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the deleted organization
   * @access protected
   * @permission platform:organization:delete
   */
  .delete("/:id{[a-zA-Z0-9_-]{21}}", requirePlatformPermissionFactory("platform:organization:delete"), async (c) => {
    const id = c.req.param("id");
    const sessionContext = c.var.sessionContext;

    const organization = await getOrganization(id);
    if (!organization) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    await teardownOrganization(organization);

    await logAction({
      action: "organization:delete",
      ctx: { actorId: sessionContext.user.id, impersonatorId: sessionContext.impersonator?.id, ...getClientInfo(c) },
      targetId: id,
      targetType: "organization",
      metadata: { name: organization.name, slug: organization.slug },
    });

    return c.json({ success: true as const, organization });
  });
