import type { Condition } from "~shared/types/auth.types";
import type { OrgId } from "~shared/types/org.types";
import type { Permission } from "~shared/types/permissions.types";

import { eq } from "drizzle-orm";

import { drizzle } from "./drizzle";
import { PoliciesModel } from "./models/policies.model";
import { RolePermissionsModel } from "./models/role-permissions.model";
import { RolesModel } from "./models/roles.model";

type TemplatePolicy = {
  effect: "allow" | "deny";
  permission: Permission;
  condition: Condition;
};

export type OrgRoleTemplate = {
  name: string;
  index: number;
  isDefault: boolean;
  permissions: Permission[];
  policies: TemplatePolicy[];
};

const ORG_PERMISSIONS: Permission[] = [
  "apiKey:list",
  "apiKey:create",
  "apiKey:revoke",
  "config:list",
  "config:update",
  "domain:list",
  "domain:create",
  "domain:delete",
  "organization:update",
  "invitation:create",
  "invitation:read",
  "invitation:list",
  "invitation:revoke",
  "invitation:delete",
  "log:list",
  "log:delete",
  "role:create",
  "role:read",
  "role:list",
  "role:update",
  "role:delete",
  "session:list",
  "session:revoke",
  "translation:update",
  "user:create",
  "user:read",
  "user:list",
  "user:update",
  "user:delete",
  "user:impersonate",
  "userRole:create",
  "userRole:delete",
];

const ADMIN_EXCLUDED_PERMISSIONS: Permission[] = [
  "config:update",
  "domain:create",
  "domain:delete",
  "organization:update",
  "role:create",
  "role:update",
  "role:delete",
  "log:delete",
  "user:impersonate",
];

/** Members can update their own profile (formerly seeded against a hardcoded role id). */
const SELF_UPDATE_POLICY: TemplatePolicy = {
  effect: "allow",
  permission: "user:update",
  condition: {
    op: "eq",
    left: { type: "user_attr", key: "id" },
    right: { type: "resource_attr", key: "id" },
  },
};

/**
 * Role blueprints seeded into every new organization. Roles remain fully
 * customizable per organization afterwards — these are starting points,
 * not global definitions.
 */
export const ORG_ROLE_TEMPLATES: OrgRoleTemplate[] = [
  {
    name: "owner",
    index: 90,
    isDefault: false,
    permissions: ORG_PERMISSIONS,
    policies: [],
  },
  {
    name: "admin",
    index: 50,
    isDefault: false,
    permissions: ORG_PERMISSIONS.filter(p => !ADMIN_EXCLUDED_PERMISSIONS.includes(p)),
    policies: [],
  },
  {
    name: "member",
    index: 20,
    isDefault: true,
    permissions: [],
    policies: [SELF_UPDATE_POLICY],
  },
];

/**
 * Seed the template roles into an organization. Idempotent: templates whose
 * name already exists in the organization are skipped, and a template marked
 * as default only becomes the default role if the organization has none yet.
 * @param orgId - The organization to seed.
 */
export async function seedOrgRoles(orgId: OrgId): Promise<void> {
  const existingRoles = await drizzle
    .select({ name: RolesModel.name, isDefault: RolesModel.isDefault })
    .from(RolesModel)
    .where(eq(RolesModel.organizationId, orgId));

  const existingNames = new Set(existingRoles.map(r => r.name));
  let hasDefault = existingRoles.some(r => r.isDefault);

  for (const template of ORG_ROLE_TEMPLATES) {
    if (existingNames.has(template.name)) {
      continue;
    }

    const [role] = await drizzle
      .insert(RolesModel)
      .values({
        organizationId: orgId,
        name: template.name,
        index: template.index,
        isDefault: template.isDefault && !hasDefault,
        isSuperAdmin: false,
      })
      .onConflictDoNothing()
      .returning();

    if (!role) {
      continue;
    }

    if (template.isDefault && !hasDefault) {
      hasDefault = true;
    }

    if (template.permissions.length > 0) {
      await drizzle
        .insert(RolePermissionsModel)
        .values(template.permissions.map(permission => ({ roleId: role.id, permission })))
        .onConflictDoNothing();
    }

    if (template.policies.length > 0) {
      await drizzle
        .insert(PoliciesModel)
        .values(template.policies.map(policy => ({
          effect: policy.effect,
          permission: policy.permission,
          roleId: role.id,
          condition: JSON.stringify(policy.condition),
        })))
        .onConflictDoNothing();
    }
  }
}
