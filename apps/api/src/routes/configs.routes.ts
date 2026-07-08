import type { OrgId } from "~shared/types/org.types";

import { Hono } from "hono";
import { randomBytes } from "node:crypto";

import { getClientInfo } from "@/helpers/get-client-info";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { getOrgContext } from "@/utils/hono";
import { CONFIG_REGISTRY_MAP } from "~shared/config.registry";
import { getConfig, getConfigs, updateConfig } from "~shared/queries/configs.queries";
import { logConfigUpdate } from "~shared/queries/logs.queries";
import { getOrgConfig, getOrgConfigs, updateOrgConfig } from "~shared/queries/org-configs.queries";
import { UpdateConfigSchema } from "~shared/schemas/api/configs.schemas";

export const configRoutes = new Hono()
  /**
   * @returns JSON response with all configurations
   * @throws 500 if an error occurs while retrieving the configurations
   * @access public
   */
  .get("/", async (c) => {
    const orgContext = getOrgContext(c);
    const configs = orgContext ? await getOrgConfigs(orgContext.org.id as OrgId) : await getConfigs();

    return c.json({
      success: true as const,
      configs: configs.map(c => c.secret ? { ...c, value: null } : c),
    });
  })

  /**
   * Get a specific configuration value by key
   *
   * @param c - The Hono context object
   * @returns JSON response with the configuration for the specified key
   * @throws 404 if the configuration key is not found
   * @throws 500 if an error occurs while retrieving the configuration
   * @access public
   */
  .get("/:key", async (c) => {
    const key = c.req.param("key");
    const orgContext = getOrgContext(c);

    const value = orgContext ? await getOrgConfig(orgContext.org.id as OrgId, key) : await getConfig(key);

    if (!value) {
      return c.json({ success: false as const, error: "Config not found" }, 404);
    }

    return c.json({ success: true as const, value: value.secret ? { ...value, value: null } : value });
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Update a configuration value by key
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated configuration data
   * @throws {500} If an error occurs while updating the configuration
   * @access protected
   * @permission config:update (resource-specific)
   */
  .put("/:key", requirePermissionFactory("config:update", c => ({ key: c.req.param("key") })), validationMiddleware("json", UpdateConfigSchema), async (c) => {
    const key = c.req.param("key");
    const { value } = c.req.valid("json");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);
    const orgContext = getOrgContext(c);

    const registryEntry = CONFIG_REGISTRY_MAP.get(key);
    if (!registryEntry) {
      return c.json({ success: false as const, error: "Config not found" }, 404);
    }

    // Platform keys are edited from the admin app only; org surfaces write
    // their own override of organization-scoped keys.
    if (orgContext && registryEntry.scope !== "organization") {
      return c.json({ success: false as const, error: "This configuration is managed by the platform" }, 403);
    }

    const oldConfig = orgContext ? await getOrgConfig(orgContext.org.id as OrgId, key) : await getConfig(key);
    const oldValue = oldConfig?.value;

    const config = orgContext
      ? await updateOrgConfig(orgContext.org.id as OrgId, key, value, sessionContext.user.id)
      : await updateConfig(key, value, sessionContext.user.id);

    await logConfigUpdate(key, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    }, oldValue, value);

    return c.json({ success: true as const, config: config.secret ? { ...config, value: null, isSet: true } : config });
  })

  /**
   * Rotate a configuration secret by regenerating its value
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated configuration
   * @throws {400} If the key is not rotatable
   * @throws {404} If the configuration key is not found
   * @access protected
   * @permission config:update (resource-specific)
   */
  .post("/:key/rotate", requirePermissionFactory("config:update", c => ({ key: c.req.param("key") })), async (c) => {
    const key = c.req.param("key");

    const registryEntry = CONFIG_REGISTRY_MAP.get(key);
    if (!registryEntry) {
      return c.json({ success: false as const, error: "Config not found" }, 404);
    }
    if (!registryEntry.rotatable) {
      return c.json({ success: false as const, error: "This configuration key does not support rotation" }, 400);
    }
    if (getOrgContext(c) && registryEntry.scope !== "organization") {
      return c.json({ success: false as const, error: "This configuration is managed by the platform" }, 403);
    }

    const existing = await getConfig(key);

    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);
    const newValue = randomBytes(32).toString("base64");

    const config = await updateConfig(key, newValue, sessionContext.user.id);

    await logConfigUpdate(key, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    }, existing?.value ?? null, newValue);

    return c.json({ success: true as const, config });
  });
