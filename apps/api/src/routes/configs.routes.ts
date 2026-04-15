import { randomBytes } from "node:crypto";

import { Hono } from "hono";

import { getClientInfo } from "@/helpers/get-client-info";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { logConfigUpdate } from "~shared/queries/logs.queries";
import { getConfig, getConfigs, updateConfig } from "~shared/queries/configs.queries";
import { UpdateConfigSchema } from "~shared/schemas/api/configs.schemas";

const ROTATABLE_KEYS = new Set(["security.jwt.secret"]);

export const configRoutes = new Hono()
  /**
   * @returns JSON response with all configurations
   * @throws 500 if an error occurs while retrieving the configurations
   * @access public
   */
  .get("/", async (c) => {
    const configs = await getConfigs();

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

    const value = await getConfig(key);

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

    const oldConfig = await getConfig(key);
    const oldValue = oldConfig?.value;

    const config = await updateConfig(key, value, sessionContext.user.id);

    await logConfigUpdate(key, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    }, oldValue, value);

    return c.json({ success: true as const, config });
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

    if (!ROTATABLE_KEYS.has(key)) {
      return c.json({ success: false as const, error: "This configuration key does not support rotation" }, 400);
    }

    const existing = await getConfig(key);
    if (!existing) {
      return c.json({ success: false as const, error: "Config not found" }, 404);
    }

    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);
    const newValue = randomBytes(32).toString("base64");

    const config = await updateConfig(key, newValue, sessionContext.user.id);

    await logConfigUpdate(key, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    }, existing.value, newValue);

    return c.json({ success: true as const, config });
  });
