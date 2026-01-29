import { Hono } from "hono";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { getRuntimeConfig, getRuntimeConfigs, updateRuntimeConfig } from "~shared/queries/runtime-configs.queries";
import { UpdateRuntimeConfigSchema } from "~shared/schemas/api/runtime-configs.schemas";

export const configRoutes = new Hono()
  /**
   * @returns JSON response with all runtime configurations
   * @throws 500 if an error occurs while retrieving the configurations
   * @access public
   */
  .get("/", async (c) => {
    try {
      const configs = await getRuntimeConfigs();

      return c.json({
        success: true as const,
        configs,
      });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Get a specific runtime-configuration value by key
   *
   * @param c - The Hono context object
   * @returns JSON response with the configuration for the specified key
   * @throws 404 if the configuration key is not found
   * @throws 500 if an error occurs while retrieving the configuration
   * @access public
   */
  .get("/:key", async (c) => {
    const key = c.req.param("key");

    try {
      const value = await getRuntimeConfig(key);

      if (!value) {
        return c.json({ success: false as const, error: "Config not found" }, 404);
      }

      return c.json({ success: true as const, value });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Update a runtime-configuration value by key
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated configuration data
   * @throws {500} If an error occurs while updating the configuration
   * @access protected
   * @permission runtimeConfig:update (resource-specific)
   */
  .put("/:key", requirePermissionFactory("runtimeConfig:update", c => ({ key: c.req.param("key") })), validationMiddleware("json", UpdateRuntimeConfigSchema), async (c) => {
    const key = c.req.param("key");
    const { value } = c.req.valid("json");
    const { user } = c.get("sessionContext");

    try {
      const config = await updateRuntimeConfig(key, value, user.id);

      return c.json({ success: true as const, config });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
