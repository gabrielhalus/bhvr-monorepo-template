import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteUser, emailExists, getUser, getUsers, updateUser } from "~shared/queries/users.queries";
import { UserRelationsQuerySchema } from "~shared/schemas/api/users.schemas";
import { UpdateUserSchema } from "~shared/schemas/db/users.schemas";

export const usersRoutes = new Hono()
  /**
   * Check if an email is available for registration
   *
   * @param c - The Hono context object
   * @returns JSON response indicating whether the email is available
   * @throws {500} If an error occurs while checking email availability
   * @access public
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
   * Get all users with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing all users
   * @throws {500} If an error occurs while retrieving users
   * @access protected
   * @permission user:list
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
   * Get a specific user by ID with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the user data
   * @throws {404} If the user is not found
   * @throws {500} If an error occurs while retrieving the user
   * @access protected
   * @permission user:read (resource-specific)
   */
  .get("/:id", validationMiddleware("query", UserRelationsQuerySchema), requirePermissionFactory("user:read", c => ({ id: c.req.param("id") })), async (c) => {
    const id = c.req.param("id");
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
   * Update a specific user by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the updated user data
   * @throws {500} If an error occurs while updating the user
   * @access protected
   * @permission user:update (resource-specific)
   */
  .put("/:id", requirePermissionFactory("user:update", c => ({ id: c.req.param("id") })), validationMiddleware("json", UpdateUserSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    try {
      const user = await updateUser(id, data);
      return c.json({ success: true as const, user });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Delete a specific user by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the deleted user data
   * @throws {500} If an error occurs while deleting the user
   * @access protected
   * @permission user:delete (resource-specific)
   */
  .delete("/:id", requirePermissionFactory("user:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const id = c.req.param("id");

    try {
      const user = await deleteUser(id);
      return c.json({ success: true as const, user });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
