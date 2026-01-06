import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteUser, emailExists, getUser, getUsers, updateUser } from "@bunstack/shared/queries/users.queries";
import { UserRelationsQuerySchema } from "~shared/schemas/api/users.schemas";
import { UpdateUserSchema } from "~shared/schemas/db/users.schemas";

export const usersRoutes = new Hono()
  /**
   * Check if an email is available.
   *
   * @param c - The context
   * @returns Whether the email is available
   */
  .get("/check-email", validationMiddleware("query", z.object({ email: z.email() })), async (c) => {
    try {
      const { email } = c.req.valid("query");
      const exists = await emailExists(email);

      return c.json({ success: true as const, available: !exists });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get all users.
   *
   * @param c - The context
   * @returns All users
   */
  .get("/", validationMiddleware("query", UserRelationsQuerySchema), requirePermissionFactory("user:list"), async (c) => {
    const { includes } = c.req.valid("query");

    try {
      const users = await getUsers(includes);

      return c.json({ success: true as const, users });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Get a user by id.
   *
   * @param c - The context
   * @returns The user
   */
  .get("/:id", validationMiddleware("query", UserRelationsQuerySchema), requirePermissionFactory("user:read", c => ({ id: c.req.param("id") })), async (c) => {
    const { id } = c.req.param();
    const { includes } = c.req.valid("query");

    try {
      const user = await getUser(id, includes);

      if (!user) {
        return c.json({ success: false, error: "Not Found" }, 404);
      }

      return c.json({ success: true as const, user });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

/**
 * Update a user by id.
 *
 * @param c - The context
 * @returns The updated user
 */
  .put("/:id", requirePermissionFactory("user:update", c => ({ id: c.req.param("id") })), validationMiddleware("json", UpdateUserSchema), async (c) => {
    const { id } = c.req.param();
    const data = c.req.valid("json");

    try {
      const user = await updateUser(id, data);
      return c.json({ success: true as const, user });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Delete a user by id.
   *
   * @param c - The context
   * @returns The deleted user
   */
  .delete("/:id", requirePermissionFactory("user:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const { id } = c.req.param();

    try {
      const user = await deleteUser(id);
      return c.json({ success: true as const, user });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
