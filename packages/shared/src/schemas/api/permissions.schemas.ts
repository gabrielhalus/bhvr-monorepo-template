import { z } from "zod";

export const PermissionSchema = z.enum([
  // Users
  "user:create",
  "user:read",
  "user:list",
  "user:update",
  "user:delete",

  // Roles
  "role:create",
  "role:read",
  "role:list",
  "role:update",
  "role:delete",

  // User-roles
  "userRole:create",
  "userRole:delete",
]);

