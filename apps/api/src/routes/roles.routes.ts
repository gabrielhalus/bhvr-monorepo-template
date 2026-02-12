import type { RoleRelations } from "~shared/types/db/roles.types";

import { Hono } from "hono";

import { getClientInfo } from "@/helpers/get-client-info";
import { auditList, auditRead } from "@/middlewares/audit";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { logRoleCreate, logRoleDelete, logRoleMembersAdd, logRoleMembersRemove } from "~shared/queries/audit-logs.queries";
import { createRole, deleteRole, getRole, getRoleByName, getRolesPaginated, roleRelationCountLoaders, roleRelationLoaders } from "~shared/queries/roles.queries";
import { createUserRole, deleteUserRole } from "~shared/queries/user-roles.queries";
import { PaginationQuerySchema } from "~shared/schemas/api/pagination.schemas";
import { CreateRoleSchema, RoleRelationsQuerySchema } from "~shared/schemas/api/roles.schemas";
import { AssignRoleMembersSchema, RemoveRoleMembersSchema } from "~shared/schemas/api/user-roles.schemas";

import { requirePermissionFactory } from "../middlewares/access-control";

export const rolesRoutes = new Hono()
  // --- All routes below this point require authentication
  .use(getSessionContext)

  /**
   * Get paginated roles with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with paginated roles with metadata
   * @throws {500} If an error occurs while retrieving roles
   * @access protected
   * @permission role:list
   */
  .get("/", validationMiddleware("query", PaginationQuerySchema), requirePermissionFactory("role:list"), auditList("role:list", "role"), async (c) => {
    const { page, limit, sortBy, sortOrder, search } = c.req.valid("query");

    try {
      const result = await getRolesPaginated({ page, limit, sortBy, sortOrder, search });

      return c.json({ success: true as const, ...result });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  /**
   * Get the relations for specified roles.
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with roles-relations mapping
   * @throws {500} If an error occurs while retrieving relations
   * @access protected
   * @permission role:list
   */
  .get("/relations", validationMiddleware("query", RoleRelationsQuerySchema), requirePermissionFactory("role:list"), async (c) => {
    const { roleIds = [], include } = c.req.valid("query");

    const relations: Record<string, Partial<RoleRelations>> = {};
    roleIds.forEach(id => (relations[id] = {}));

    await Promise.all(
      include.map(async (key) => {
        const loader = roleRelationLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader(roleIds);

        for (const [roleId, items] of Object.entries(data)) {
          relations[roleId]![key] = items;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Get the count of relations for specified roles.
   *
   * @param ctx - Hono context, including session info
   * @returns JSON response with the count of role relations
   * @throws {500} If an error occurs while retrieving relations count
   * @access protected
   * @permission role:list
   */
  .get("/relations/count", validationMiddleware("query", RoleRelationsQuerySchema), requirePermissionFactory("role:list"), async (c) => {
    const { roleIds = [], include } = c.req.valid("query");

    const relations: Record<string, Record<string, number>> = {};
    roleIds.forEach(id => (relations[id] = {}));

    await Promise.all(
      include.map(async (key) => {
        const loader = roleRelationCountLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader(roleIds);

        for (const [roleId, items] of Object.entries(data)) {
          relations[roleId]![key] = items;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Create a new role
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the created role data
   * @throws {400} If role name already exists
   * @throws {500} If an error occurs while creating the role
   * @access protected
   * @permission role:create
   */
  .post("/", requirePermissionFactory("role:create"), validationMiddleware("json", CreateRoleSchema), async (c) => {
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);
    const data = c.req.valid("json");

    try {
      const role = await createRole(data);

      await logRoleCreate(String(role.id), {
        actorId: sessionContext.user.id,
        impersonatorId: sessionContext.impersonator?.id,
        ...clientInfo,
      }, role.name);

      return c.json({ success: true as const, role });
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        return c.json({ success: false as const, error: "Role name already exists" }, 400);
      }
      throw error;
    }
  })

  /**
   * Get a specific role by ID with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the role data
   * @throws {404} If the role is not found
   * @throws {500} If an error occurs while retrieving the role
   * @access protected
   * @permission role:read
   */
  .get("/:id{[0-9]+}", requirePermissionFactory("role:read"), auditRead("role:read", "role"), async (c) => {
    const id = Number(c.req.param("id"));

    const role = await getRole(id);

    if (!role) {
      return c.json({ success: false as const, error: "Role not found" }, 404);
    }

    return c.json({ success: true as const, role });
  })

  /**
   * Get relations for a specific role.
   *
   * @param ctx - Hono context, including session info
   * @param id - Role ID
   * @returns JSON response with the specified role's relations
   * @throws {500} If an error occurs while retrieving relations
   * @access protected
   * @permission role:read
   */
  .get("/:id{[0-9]+}/relations", requirePermissionFactory("role:read", c => ({ id: c.req.param("id") })), validationMiddleware("query", RoleRelationsQuerySchema), async (c) => {
    const id = Number(c.req.param("id"));
    const { include } = c.req.valid("query");

    const relations: Record<string, Partial<RoleRelations>> = {};

    await Promise.all(
      include.map(async (key) => {
        const loader = roleRelationLoaders[key];
        if (!loader)
          throw new Error(`No relation loader defined for "${key}"`);

        const data = await loader([id]);

        for (const [_, items] of Object.entries(data)) {
          relations[key] = items as Partial<RoleRelations>;
        }
      }),
    );

    return c.json({ success: true as const, relations });
  })

  /**
   * Get the count of relations for a specific role.
   *
   * @param ctx - Hono context, including session info
   * @param id - Role ID
   * @returns JSON response with the count of relations for the role
   * @throws {500} If an error occurs while retrieving relations count
   * @access protected
   * @permission role:read
   */
  .get("/:id{[0-9]+}/relations/count", requirePermissionFactory("role:read", c => ({ id: c.req.param("id") })), validationMiddleware("query", RoleRelationsQuerySchema), async (c) => {
    const id = Number(c.req.param("id"));
    const { include } = c.req.valid("query");

    const relations: Record<string, number> = {};

    await Promise.all(
      include.map(async (key) => {
        const loader = roleRelationCountLoaders[key];
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
   * Get a specific role by name with optional relation includes
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the role data
   * @throws {404} If the role is not found
   * @throws {500} If an error occurs while retrieving the role
   * @access protected
   * @permission role:read
   */
  .get("/:name", requirePermissionFactory("role:read"), async (c) => {
    const name = c.req.param("name");

    const role = await getRoleByName(name);

    if (!role) {
      return c.json({ success: false as const, error: "Role not found" }, 404);
    }

    return c.json({ success: true as const, role });
  })

  /**
   * Delete a specific role by ID
   *
   * @param c - The Hono context object with session context
   * @returns JSON response with the deleted role data
   * @throws {500} If an error occurs while deleting the role
   * @access protected
   * @permission role:delete (resource-specific)
   */
  .delete("/:id{[0-9]+}", requirePermissionFactory("role:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const id = Number(c.req.param("id"));
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    const role = await deleteRole(id);

    await logRoleDelete(String(id), {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const, role });
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
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    for (const userId of userIds) {
      await createUserRole({ userId, roleId: id });
    }

    await logRoleMembersAdd(String(id), userIds, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const });
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
    const sessionContext = c.var.sessionContext;
    const clientInfo = getClientInfo(c);

    for (const userId of userIds) {
      await deleteUserRole({ userId, roleId: id });
    }

    await logRoleMembersRemove(String(id), userIds, {
      actorId: sessionContext.user.id,
      impersonatorId: sessionContext.impersonator?.id,
      ...clientInfo,
    });

    return c.json({ success: true as const });
  });
