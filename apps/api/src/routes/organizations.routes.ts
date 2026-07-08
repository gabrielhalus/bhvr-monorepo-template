import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";
import { z } from "zod";

import { getClientInfo } from "@/helpers/get-client-info";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { auditList, auditMiddleware } from "@/middlewares/audit";
import { getSessionContext } from "@/middlewares/auth";
import { BASE_DOMAIN, invalidateOrgDomains } from "@/middlewares/org-context";
import { validationMiddleware } from "@/middlewares/validation";
import { requireOrg } from "@/utils/hono";
import { OVERRIDABLE_I18N_KEYS } from "~shared/i18n/overridable-keys";
import { logAction } from "~shared/queries/logs.queries";
import { createOrganizationDomain, deleteOrganizationDomain, getOrganizationDomains, verifyOrganizationDomain } from "~shared/queries/organization-domains.queries";
import { getTranslationOverrides, setTranslationOverride } from "~shared/queries/organization-translations.queries";
import { getOrganization, updateOrganization } from "~shared/queries/organizations.queries";
import { DomainNameSchema } from "~shared/schemas/db/organization-domains.schemas";
import { UpdateOrganizationSchema } from "~shared/schemas/db/organizations.schemas";

const CreateDomainSchema = z.object({ domain: DomainNameSchema });

/** DNS TXT record prefix used to prove ownership of a custom domain. */
const VERIFICATION_RECORD_PREFIX = "_bunstack-verify.";

const UpdateTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  namespace: z.string().min(1).max(32),
  key: z.string().min(1).max(255),
  /** null resets the key to the bundled default */
  value: z.string().nullable(),
});

export const organizationsRoutes = new Hono()
  /**
   * Translation overrides for a locale (overrides-only bundle, merged into
   * the bundled defaults by the frontend at boot)
   *
   * @param c - The Hono context object
   * @returns JSON response with the overrides grouped by namespace
   * @access public
   */
  .get("/translations/:locale", async (c) => {
    const locale = c.req.param("locale");
    const overrides = await getTranslationOverrides(requireOrg(c), locale);

    return c.json({ success: true as const, overrides });
  })

  // --- All routes below require authentication (and an org surface via requireOrg)
  .use(getSessionContext)

  /**
   * Upsert (or reset) a wording override
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @access protected
   * @permission translation:update
   */
  .put("/translations", requirePermissionFactory("translation:update"), validationMiddleware("json", UpdateTranslationSchema), async (c) => {
    const orgId = requireOrg(c);
    const { locale, namespace, key, value } = c.req.valid("json");
    const sessionContext = c.var.sessionContext;

    await setTranslationOverride(orgId, locale, namespace, key, value, sessionContext.user.id);

    await logAction({
      action: "translation:update",
      ctx: { actorId: sessionContext.user.id, impersonatorId: sessionContext.impersonator?.id, ...getClientInfo(c) },
      targetId: `${locale}/${namespace}/${key}`,
      targetType: "translation",
      metadata: { value },
    });

    return c.json({ success: true as const });
  })

  /**
   * The curated list of overridable wording keys (for the settings editor)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the overridable keys
   * @access protected
   * @permission translation:update
   */
  .get("/translations", requirePermissionFactory("translation:update"), async (c) => {
    return c.json({ success: true as const, keys: OVERRIDABLE_I18N_KEYS });
  })

  /**
   * Get the current organization (resolved from the request domain)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the organization
   * @access protected
   */
  .get("/", async (c) => {
    const organization = await getOrganization(requireOrg(c));

    if (!organization) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    return c.json({ success: true as const, organization });
  })

  /**
   * Update the current organization (name, slug, metadata)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated organization
   * @throws {400} If the slug is already taken
   * @access protected
   * @permission organization:update
   */
  .put("/", requirePermissionFactory("organization:update"), validationMiddleware("json", UpdateOrganizationSchema), auditMiddleware({ action: "organization:update", targetType: "organization" }), async (c) => {
    const orgId = requireOrg(c);
    const updates = c.req.valid("json");

    const previous = await getOrganization(orgId);

    try {
      const organization = await updateOrganization(orgId, updates);

      // A slug change moves the org's subdomain — keep the domain row and
      // the resolution cache in sync
      if (previous && updates.slug && updates.slug !== previous.slug) {
        const domains = await getOrganizationDomains(orgId);
        const oldSubdomain = domains.find(d => d.type === "subdomain" && d.domain === `${previous.slug}.${BASE_DOMAIN}`);

        if (oldSubdomain) {
          await deleteOrganizationDomain(orgId, oldSubdomain.id);
        }
        await createOrganizationDomain({
          organizationId: orgId,
          domain: `${updates.slug}.${BASE_DOMAIN}`,
          type: "subdomain",
          isPrimary: oldSubdomain?.isPrimary ?? false,
          verifiedAt: new Date().toISOString(),
        });

        await invalidateOrgDomains([`${previous.slug}.${BASE_DOMAIN}`, `${updates.slug}.${BASE_DOMAIN}`]);
      }

      return c.json({ success: true as const, organization });
    } catch (error) {
      if (error instanceof Error && error.message.includes("organizations_slug_unique")) {
        return c.json({ success: false as const, error: "Slug is already taken" }, 400);
      }
      throw error;
    }
  })

  /**
   * List the organization's domains
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the domains
   * @access protected
   * @permission domain:list
   */
  .get("/domains", requirePermissionFactory("domain:list"), auditList("domain:list", "domain"), async (c) => {
    const domains = await getOrganizationDomains(requireOrg(c));
    return c.json({ success: true as const, domains });
  })

  /**
   * Add a custom domain to the organization. The domain must then be
   * verified via a DNS TXT record before it resolves.
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the created domain and the expected DNS record
   * @throws {400} If the domain is already registered
   * @access protected
   * @permission domain:create
   */
  .post("/domains", requirePermissionFactory("domain:create"), validationMiddleware("json", CreateDomainSchema), async (c) => {
    const orgId = requireOrg(c);
    const { domain } = c.req.valid("json");
    const sessionContext = c.var.sessionContext;
    const hostname = domain.toLowerCase();

    if (hostname === BASE_DOMAIN || hostname.endsWith(`.${BASE_DOMAIN}`)) {
      return c.json({ success: false as const, error: "Subdomains of the base domain are managed automatically" }, 400);
    }

    try {
      const verificationToken = randomBytes(24).toString("base64url");
      const created = await createOrganizationDomain({
        organizationId: orgId,
        domain: hostname,
        type: "custom",
        isPrimary: false,
        verificationToken,
      });

      await logAction({
        action: "domain:create",
        ctx: { actorId: sessionContext.user.id, impersonatorId: sessionContext.impersonator?.id, ...getClientInfo(c) },
        targetId: hostname,
        targetType: "domain",
      });

      return c.json({
        success: true as const,
        domain: created,
        verification: {
          type: "TXT",
          name: `${VERIFICATION_RECORD_PREFIX}${hostname}`,
          value: verificationToken,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("organization_domains_domain_unique")) {
        return c.json({ success: false as const, error: "Domain is already registered" }, 400);
      }
      throw error;
    }
  })

  /**
   * Verify a custom domain by checking its DNS TXT record
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the verified domain
   * @throws {400} If the TXT record is missing or does not match
   * @access protected
   * @permission domain:create
   */
  .post("/domains/:id{[0-9]+}/verify", requirePermissionFactory("domain:create"), async (c) => {
    const orgId = requireOrg(c);
    const id = Number(c.req.param("id"));

    const domains = await getOrganizationDomains(orgId);
    const domain = domains.find(d => d.id === id);

    if (!domain) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    if (domain.verifiedAt) {
      return c.json({ success: true as const, domain });
    }

    let records: string[][] = [];
    try {
      records = await dns.resolveTxt(`${VERIFICATION_RECORD_PREFIX}${domain.domain}`);
    } catch {
      // NXDOMAIN or DNS failure — treated as a missing record below
    }

    const matches = records.some(chunks => chunks.join("") === domain.verificationToken);

    if (!matches) {
      return c.json({ success: false as const, error: "Verification TXT record not found" }, 400);
    }

    const verified = await verifyOrganizationDomain(orgId, id);
    await invalidateOrgDomains([domain.domain]);

    return c.json({ success: true as const, domain: verified });
  })

  /**
   * Remove a domain from the organization
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the deleted domain
   * @throws {400} When removing the organization's subdomain
   * @access protected
   * @permission domain:delete
   */
  .delete("/domains/:id{[0-9]+}", requirePermissionFactory("domain:delete"), async (c) => {
    const orgId = requireOrg(c);
    const id = Number(c.req.param("id"));
    const sessionContext = c.var.sessionContext;

    const domains = await getOrganizationDomains(orgId);
    const domain = domains.find(d => d.id === id);

    if (!domain) {
      return c.json({ success: false as const, error: "Not Found" }, 404);
    }

    if (domain.type === "subdomain") {
      return c.json({ success: false as const, error: "The organization subdomain cannot be removed" }, 400);
    }

    const deleted = await deleteOrganizationDomain(orgId, id);
    await invalidateOrgDomains([domain.domain]);

    await logAction({
      action: "domain:delete",
      ctx: { actorId: sessionContext.user.id, impersonatorId: sessionContext.impersonator?.id, ...getClientInfo(c) },
      targetId: domain.domain,
      targetType: "domain",
    });

    return c.json({ success: true as const, domain: deleted });
  });
