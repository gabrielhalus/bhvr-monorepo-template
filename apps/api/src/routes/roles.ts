import type { RoleRelationKeys } from "@bunstack/shared/types/roles.types";

import { Hono } from "hono";

import { requirePermissionFactory } from "../middlewares/access-control";
import { getSessionContext } from "@bunstack/api/middlewares/auth";
import { validationMiddleware } from "@bunstack/api/middlewares/validation";
import { deleteRole, getRole, getRoleByName, getRoles, updateRole } from "@bunstack/db/queries/roles.queries";
import { createUserRole, deleteUserRole } from "@bunstack/db/queries/user-roles.queries";
import { RoleRelationsQuerySchema, UpdateRoleSchema } from "@bunstack/shared/schemas/roles.schemas";
import { UserRoleSchema } from "@bunstack/shared/schemas/user-roles.schemas";

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

  .put("/:id", requirePermissionFactory("role:update", c => ({ id: c.req.param("id") })), validationMiddleware("json", UpdateRoleSchema), async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const data = c.req.valid("json");

      const role = await updateRole(id, data);
      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  .delete("/:id", requirePermissionFactory("role:delete", c => ({ id: c.req.param("id") })), async (c) => {
    const id = Number(c.req.param("id"));

    try {
      const role = await deleteRole(id);
      return c.json({ success: true as const, role });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  .post("/assign", requirePermissionFactory("userRole:create"), validationMiddleware("json", UserRoleSchema), async (c) => {
    const { userId, roleId } = c.req.valid("json");

    try {
      const userRole = await createUserRole({ userId, roleId });
      return c.json({ success: true as const, userRole });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  })

  .post("/remove", requirePermissionFactory("userRole:create"), validationMiddleware("json", UserRoleSchema), async (c) => {
    const { userId, roleId } = c.req.valid("json");

    try {
      const userRole = await deleteUserRole({ userId, roleId });
      return c.json({ success: true as const, userRole });
    } catch (error) {
      return c.json({ success: false as const, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });
