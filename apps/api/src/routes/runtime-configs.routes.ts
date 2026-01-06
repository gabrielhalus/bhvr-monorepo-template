import { Hono } from "hono";

export const configRoutes = new Hono()
  /**
   * Get all runtime-configurations
   *
   * @param c - The context
   * @returns The runtime-configurations
   */
  .get("/", (c) => {
    return c.json({ success: true as const });
  })

  .get("/:key", (c) => {
    const { key } = c.req.param();
    return c.json({ success: true, key });
  });
