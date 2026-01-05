import type { RoleRelationKeys } from "@bunstack/shared/types/db/roles.types";

import { Hono } from "hono";

import { requirePermissionFactory } from "../middlewares/access-control";
import { getSessionContext } from "@/middlewares/auth";
import { validationMiddleware } from "@/middlewares/validation";
import { deleteRole, getRole, getRoleByName, getRoles, updateRole } from "@bunstack/db/queries/roles.queries";
import { createUserRole, deleteUserRole } from "@bunstack/db/queries/user-roles.queries";
import { RoleRelationsQuerySchema, UpdateRoleSchema } from "@bunstack/shared/schemas/api/roles.schemas";
import { AssignRoleMembersSchema, RemoveRoleMembersSchema } from "@bunstack/shared/schemas/api/user-roles.schemas";

export const rolesRoutes = new Hono()
  // --- All routes below this point require authentication
  .use(getSessionContext)

  .get("/", requirePermissionFactory("role:list"), async (c) => {
    const { includes } = c.req.queries();

    try {
      const roles = await getRoles(includes as RoleRelationKeys);

      return c.json({ success: true as const, roles });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  .get("/:id{[0-9]+}", validationMiddleware("query", RoleRelationsQuerySchema), requirePermissionFactory("role:read"), async (c) => {
    const { id } = c.req.param();
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

  .get("/:name", validationMiddleware("query", RoleRelationsQuerySchema), requirePermissionFactory("role:read"), async (c) => {
    const { name } = c.req.param();
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

  .delete("/:id{[0-9]+}", requirePermissionFactory("role:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const id = Number(c.req.param("id"));

    try {
      const role = await deleteRole(id);
      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

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
