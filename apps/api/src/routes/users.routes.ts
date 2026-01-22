import { password } from "bun";
import { Hono } from "hono";
import { z } from "zod";

import { requirePermissionFactory } from "@/middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteUser, emailExists, getUser, getUsersPaginated, updateUser, updateUserPassword } from "~shared/queries/users.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";
import { UserRelationsQuerySchema } from "~shared/schemas/api/users.schemas";
import { UpdateUserSchema } from "~shared/schemas/db/users.schemas";

const PaginatedUsersQuerySchema = PaginationQuerySchema.extend(UserRelationsQuerySchema.shape);

/**
 * Generates a random password that meets the password requirements.
 * @returns A random password string.
 */
function generateRandomPassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  // Ensure at least one of each required character type
  const requiredChars = [
    getRandomChar(lowercase),
    getRandomChar(uppercase),
    getRandomChar(digits),
    getRandomChar(special),
  ];

  // Fill the rest with random characters from all types
  const allChars = lowercase + uppercase + digits + special;
  const remainingLength = 12 - requiredChars.length;

  for (let i = 0; i < remainingLength; i++) {
    requiredChars.push(getRandomChar(allChars));
  }

  // Shuffle the array
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]];
  }

  return requiredChars.join("");
}

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
   * Get paginated users with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing paginated users with metadata
   * @throws {500} If an error occurs while retrieving users
   * @access protected
   * @permission user:list
   */
  .get("/", validationMiddleware("query", PaginatedUsersQuerySchema), requirePermissionFactory("user:list"), async (c) => {
    const { includes, page, limit, sortBy, sortOrder, search } = c.req.valid("query");

    try {
      const result = await getUsersPaginated({ page, limit, sortBy, sortOrder, search }, includes);

      return c.json({ success: true as const, ...result });
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
   * Reset a user's password and generate a new random one
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the new password (plaintext)
   * @throws {404} If the user is not found
   * @throws {500} If an error occurs while resetting the password
   * @access protected
   * @permission user:update (resource-specific)
   */
  .post("/:id/reset-password", requirePermissionFactory("user:update", c => ({ id: c.req.param("id") })), async (c) => {
    const id = c.req.param("id");

    try {
      const user = await getUser(id);
      if (!user) {
        return c.json({ success: false as const, error: "User not found" }, 404);
      }

      const newPassword = generateRandomPassword();
      const hashedPassword = await password.hash(newPassword);

      await updateUserPassword(id, hashedPassword);

      return c.json({ success: true as const, password: newPassword });
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
