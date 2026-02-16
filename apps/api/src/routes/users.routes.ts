import type { UserRelations } from "~shared/types/db/users.types";

import { password } from "bun";
import { Hono } from "hono";
import { z } from "zod";

import { generateRandomPassword } from "@/helpers/generate-random-password";
import { getClientInfo } from "@/helpers/get-client-info";
import { requirePermissionFactory } from "@/middlewares/access-control";
import { auditList, auditRead } from "@/middlewares/audit";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { logPasswordReset, logSessionRevokeAll, logTokenRevoke, logUserDelete, logUserRolesUpdate, logUserUpdate } from "~shared/queries/audit-logs.queries";
import { getUserRoleIds, updateUserRoles } from "~shared/queries/user-roles.queries";
import { getActiveTokensByUserId, revokeAllTokensByUserId, revokeToken } from "~shared/queries/tokens.queries";
import { deleteUser, emailExists, getUser, getUsersPaginated, updateUser, updateUserPassword, userRelationCountLoaders, userRelationLoaders } from "~shared/queries/users.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";
import { UpdateUserRolesSchema, UserRelationsQuerySchema } from "~shared/schemas/api/users.schemas";
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
    const { email } = c.req.valid("query");
    const exists = await emailExists(email);

    return c.json({ success: true as const, available: !exists });
  })

  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get paginated users with optional relation include
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated users with metadata
   * @throws {500} If an error occurs while retrieving users
   * @access protected
   * @permission user:list
   */
  .get("/", validationMiddleware("query", PaginationQuerySchema), requirePermissionFactory("user:list"), auditList("user:list", "user"), async (c) => {
    const { page, limit, sortBy, sortOrder, search } = c.req.valid("query");

    const result = await getUsersPaginated({ page, limit, sortBy, sortOrder, search });

    return c.json({ success: true as const, ...result });
  })

  /**
   * Get the relations for specified users.
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with users-relations mapping
   * @throws {500} If an error occurs while retrieving relations
   * @access protected
   * @permission user:list
   */
  .get("/relations", validationMiddleware("query", UserRelationsQuerySchema), requirePermissionFactory("user:list"), async (c) => {
    const { userIds = [], include } = c.req.valid("query");

    const relations: Record<string, Partial<UserRelations>> = {};
    userIds.forEach(id => (relations[id] = {}));

    await Promise.all(
      include.map(async (key) => {
        const loader = userRelationLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader(userIds);

        for (const [userId, items] of Object.entries(data)) {
          relations[userId]![key] = items;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Get the count of relations for specified users.
   *
   * @param ctx - Hono context, including session info
   * @returns JSON response with the count of user relations
   * @throws {500} If an error occurs while retrieving relations count
   * @access protected
   * @permission user:list
   */
  .get("/relations/count", validationMiddleware("query", UserRelationsQuerySchema), requirePermissionFactory("user:list"), async (c) => {
    const { userIds = [], include } = c.req.valid("query");

    const relations: Record<string, Record<string, number>> = {};
    userIds.forEach(id => (relations[id] = {}));

    await Promise.all(
      include.map(async (key) => {
        const loader = userRelationCountLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader(userIds);

        for (const [userId, items] of Object.entries(data)) {
          relations[userId]![key] = items;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Get a specific user by ID with optional relation include
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the user data
   * @throws {404} If the user is not found
   * @throws {500} If an error occurs while retrieving the user
   * @access protected
   * @permission user:read (resource-specific)
   */
  .get("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("user:read", c => ({ id: c.req.param("id") })), auditRead("user:read", "user"), async (c) => {
    const id = c.req.param("id");

    const user = await getUser(id);

    if (!user) {
      return c.json({ success: false, error: "Not Found" }, 404);
    }

    return c.json({ success: true as const, user });
  })

  /**
   * Get relations for a specific user.
   *
   * @param ctx - Hono context, including session info
   * @param id - User ID
   * @returns JSON response with the specified user's relations
   * @throws {500} If an error occurs while retrieving relations
   * @access protected
   * @permission user:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/relations", requirePermissionFactory("user:read", c => ({ id: c.req.param("id") })), validationMiddleware("query", UserRelationsQuerySchema), async (c) => {
    const id = c.req.param("id");
    const { include } = c.req.valid("query");

    const relations: Record<string, Partial<UserRelations>> = {};

    await Promise.all(
      include.map(async (key) => {
        const loader = userRelationLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader([id]);

        for (const [_, items] of Object.entries(data)) {
          relations[key] = items as Partial<UserRelations>;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Get the count of relations for a specific user.
   *
   * @param ctx - Hono context, including session info
   * @param id - User ID
   * @returns JSON response with the count of relations for the user
   * @throws {500} If an error occurs while retrieving relations count
   * @access protected
   * @permission user:read
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/relations/count", requirePermissionFactory("user:read", c => ({ id: c.req.param("id") })), validationMiddleware("query", UserRelationsQuerySchema), async (c) => {
    const id = c.req.param("id");
    const { include } = c.req.valid("query");

    const relations: Record<string, number> = {};

    await Promise.all(
      include.map(async (key) => {
        const loader = userRelationCountLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader([id]);

        for (const [_, items] of Object.entries(data)) {
          relations[key] = items;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Update a specific user by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated user data
   * @throws {500} If an error occurs while updating the user
   * @access protected
   * @permission user:update (resource-specific)
   */
  .put("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("user:update", c => ({ id: c.req.param("id") })), validationMiddleware("json", UpdateUserSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const user = await updateUser(id, data);

    await logUserUpdate(id, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    }, data);

    return c.json({ success: true as const, user });
  })

  /**
   * Reset a user's password and generate a new random one
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the new password (plaintext)
   * @throws {404} If the user is not found
   * @throws {500} If an error occurs while resetting the password
   * @access protected
   * @permission user:update (resource-specific)
   */
  .post("/:id{[a-zA-Z0-9-]{21}}/reset-password", requirePermissionFactory("user:update", c => ({ id: c.req.param("id") })), async (c) => {
    const id = c.req.param("id");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const user = await getUser(id);
    if (!user) {
      return c.json({ success: false as const, error: "User not found" }, 404);
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await password.hash(newPassword);

    await updateUserPassword(id, hashedPassword);

    // Revoke all sessions for the user after admin password reset
    await revokeAllTokensByUserId(id);

    await logPasswordReset(id, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, password: newPassword });
  })

  /**
   * Update a user's roles
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the updated roles
   * @throws {404} If the user is not found
   * @throws {500} If an error occurs while updating the roles
   * @access protected
   * @permission userRole:create
   */
  .put("/:id{[a-zA-Z0-9-]{21}}/roles", requirePermissionFactory("userRole:create"), validationMiddleware("json", UpdateUserRolesSchema), async (c) => {
    const id = c.req.param("id");
    const { roleIds } = c.req.valid("json");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const user = await getUser(id);
    if (!user) {
      return c.json({ success: false as const, error: "User not found" }, 404);
    }

    const previousRoleIds = await getUserRoleIds(id);
    await updateUserRoles(id, roleIds);

    await logUserRolesUpdate(id, roleIds, previousRoleIds, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, roleIds });
  })

  /**
   * Delete a specific user by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the deleted user data
   * @throws {500} If an error occurs while deleting the user
   * @access protected
   * @permission user:delete (resource-specific)
   */
  .delete("/:id{[a-zA-Z0-9-]{21}}", requirePermissionFactory("user:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const id = c.req.param("id");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const user = await deleteUser(id);

    await logUserDelete(id, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, user });
  })

  /**
   * Get all active sessions for a specific user (admin)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with list of active sessions
   * @throws {404} If the user is not found
   * @access protected
   * @permission session:list
   */
  .get("/:id{[a-zA-Z0-9-]{21}}/sessions", requirePermissionFactory("session:list"), async (c) => {
    const id = c.req.param("id");

    try {
      const user = await getUser(id);
      if (!user) {
        return c.json({ success: false as const, error: "User not found" }, 404);
      }

      const sessions = await getActiveTokensByUserId(id);

      return c.json({ success: true as const, sessions });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Revoke a specific session for a user (admin)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @throws {404} If the session is not found for this user
   * @access protected
   * @permission session:revoke
   */
  .delete("/:id{[a-zA-Z0-9-]{21}}/sessions/:tokenId", requirePermissionFactory("session:revoke"), async (c) => {
    const id = c.req.param("id");
    const tokenId = c.req.param("tokenId");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    try {
      const tokens = await getActiveTokensByUserId(id);
      const token = tokens.find(t => t.id === tokenId);

      if (!token) {
        return c.json({ success: false as const, error: "Session not found" }, 404);
      }

      await revokeToken(tokenId);

      await logTokenRevoke(tokenId, {
        actorId: sessionContext.user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      });

      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Revoke all sessions for a specific user (admin)
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @throws {404} If the user is not found
   * @access protected
   * @permission session:revoke
   */
  .delete("/:id{[a-zA-Z0-9-]{21}}/sessions", requirePermissionFactory("session:revoke"), async (c) => {
    const id = c.req.param("id");
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    try {
      const user = await getUser(id);
      if (!user) {
        return c.json({ success: false as const, error: "User not found" }, 404);
      }

      await revokeAllTokensByUserId(id);

      await logSessionRevokeAll(id, {
        actorId: sessionContext.user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      });

      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
