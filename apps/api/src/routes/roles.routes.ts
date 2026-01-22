import { Hono } from "hono";

import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteRole, getRole, getRoleByName, getRolesPaginated, updateRole } from "~shared/queries/roles.queries";
import { createUserRole, deleteUserRole } from "~shared/queries/user-roles.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";
import { RoleRelationsQuerySchema, UpdateRoleSchema } from "~shared/schemas/api/roles.schemas";
import { AssignRoleMembersSchema, RemoveRoleMembersSchema } from "~shared/schemas/api/user-roles.schemas";

import { requirePermissionFactory } from "../middlewares/access-control";

/**
 * Combined schema for paginated roles query
 */
const PaginatedRolesQuerySchema = PaginationQuerySchema.extend(RoleRelationsQuerySchema.shape);

export const rolesRoutes = new Hono()
  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get paginated roles with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing paginated roles with metadata
   * @throws {500} If an error occurs while retrieving roles
   * @access protected
   * @permission role:list
   */
  .get("/", validationMiddleware("query", PaginatedRolesQuerySchema), requirePermissionFactory("role:list"), async (c) => {
    const { includes, page, limit, sortBy, sortOrder, search } = c.req.valid("query");

    try {
      const result = await getRolesPaginated({ page, limit, sortBy, sortOrder, search }, includes);

      return c.json({ success: true as const, ...result });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Get a specific role by ID with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the role data
   * @throws {404} If the role is not found
   * @throws {500} If an error occurs while retrieving the role
   * @access protected
   * @permission role:read
   */
  .get("/:id{[0-9]+}", validationMiddleware("query", RoleRelationsQuerySchema), requirePermissionFactory("role:read"), async (c) => {
    const id = c.req.param("id");
    const { includes } = c.req.valid("query");

    try {
      const role = await getRole(Number(id), includes);

      if (!role) {
        return c.json({ success: false as const, error: "Role not found" }, 404);
      }

      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Get a specific role by name with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the role data
   * @throws {404} If the role is not found
   * @throws {500} If an error occurs while retrieving the role
   * @access protected
   * @permission role:read
   */
  .get("/:name", validationMiddleware("query", RoleRelationsQuerySchema), requirePermissionFactory("role:read"), async (c) => {
    const name = c.req.param("name");
    const { includes } = c.req.valid("query");

    try {
      const role = await getRoleByName(name, includes);

      if (!role) {
        return c.json({ success: false as const, error: "Role not found" }, 404);
      }

      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Update a specific role by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the updated role data
   * @throws {500} If an error occurs while updating the role
   * @access protected
   * @permission role:update (resource-specific)
   */
  .put("/:id{[0-9]+}", requirePermissionFactory("role:update", c => ({ id: c.req.param("id") })), validationMiddleware("json", UpdateRoleSchema), async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const data = c.req.valid("json");

      const role = await updateRole(id, data);
      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Delete a specific role by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response containing the deleted role data
   * @throws {500} If an error occurs while deleting the role
   * @access protected
   * @permission role:delete (resource-specific)
   */
  .delete("/:id{[0-9]+}", requirePermissionFactory("role:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const id = Number(c.req.param("id"));

    try {
      const role = await deleteRole(id);
      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Assign multiple users as members to a specific role
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @throws {500} If an error occurs while assigning role members
   * @access protected
   * @permission userRole:create
   */
  .post("/:id{[0-9]+}/members", requirePermissionFactory("userRole:create"), validationMiddleware("json", AssignRoleMembersSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const { userIds } = c.req.valid("json");

    try {
      for (const userId of userIds) {
        await createUserRole({ userId, roleId: id });
      }
      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Remove multiple users as members from a specific role
   *
   * @param c - The Hono context object with session context
   * @returns JSON response indicating success
   * @throws {500} If an error occurs while removing role members
   * @access protected
   * @permission userRole:create
   */
  .delete("/:id{[0-9]+}/members", requirePermissionFactory("userRole:create"), validationMiddleware("json", RemoveRoleMembersSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const { userIds } = c.req.valid("json");

    try {
      for (const userId of userIds) {
        await deleteUserRole({ userId, roleId: id });
      }
      return c.json({ success: true as const });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
