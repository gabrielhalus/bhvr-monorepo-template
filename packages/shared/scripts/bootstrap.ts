import { isNull, notInArray, or } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const { drizzle } = await import("../src/drizzle");
const { CONFIG_REGISTRY } = await import("../src/config.registry");
const { RolesModel } = await import("../src/models/roles.model");
const { ConfigModel } = await import("../src/models/configs.model");
const { OrganizationsModel } = await import("../src/models/organizations.model");
const { OrganizationDomainsModel } = await import("../src/models/organization-domains.model");
const { OrganizationMembersModel } = await import("../src/models/organization-members.model");
const { UsersModel } = await import("../src/models/users.model");
const { seedOrgRoles } = await import("../src/role-templates");
const { asOrgId } = await import("../src/types/org.types");

// ============================================================================
// Default organization
// ============================================================================

// Normally created by migration 0004; recreated here for repair scenarios.
const DEFAULT_ORG_ID = "org_default_000000000";
// eslint-disable-next-line node/no-process-env
const DEFAULT_ORG_SLUG = process.env.DEFAULT_ORG_SLUG ?? "default";

await drizzle
  .insert(OrganizationsModel)
  .values({ id: DEFAULT_ORG_ID, name: "Default", slug: DEFAULT_ORG_SLUG })
  .onConflictDoNothing();

const defaultOrgId = asOrgId(DEFAULT_ORG_ID);

// Subdomain row so the default organization is reachable. BASE_DOMAIN is the
// apex the tenant apps are served under (dev default: lvh.me → 127.0.0.1).
// eslint-disable-next-line node/no-process-env
const baseDomain = (process.env.BASE_DOMAIN ?? "lvh.me").split(":")[0];

await drizzle
  .insert(OrganizationDomainsModel)
  .values({
    organizationId: DEFAULT_ORG_ID,
    domain: `${DEFAULT_ORG_SLUG}.${baseDomain}`.toLowerCase(),
    type: "subdomain",
    isPrimary: true,
    verifiedAt: new Date().toISOString(),
  })
  .onConflictDoNothing();

// ============================================================================
// Roles
// ============================================================================

// Platform role (organizationId NULL): full platform access via the
// super-admin bypass. Normally created by migration 0004.
await drizzle
  .insert(RolesModel)
  .values({ name: "platform-admin", index: 1000, isDefault: false, isSuperAdmin: true, organizationId: null })
  .onConflictDoNothing();

// Org role templates (owner/admin/member); skips names that already exist,
// preserving roles migrated from single-tenant installs.
await seedOrgRoles(defaultOrgId);

// ============================================================================
// Memberships
// ============================================================================

// Every existing user belongs to the default organization (repair for users
// created between migration and bootstrap re-runs).
const users = await drizzle.select({ id: UsersModel.id }).from(UsersModel);

if (users.length > 0) {
  await drizzle
    .insert(OrganizationMembersModel)
    .values(users.map(u => ({ organizationId: DEFAULT_ORG_ID, userId: u.id })))
    .onConflictDoNothing();
}

// ============================================================================
// Runtime configs
// ============================================================================

// Config metadata lives in the registry (src/config.registry.ts); the DB only
// stores overrides. Remove rows that can never be legit overrides: keys that
// left the registry, and null-valued rows left over from the old seeding.
const registryKeys = CONFIG_REGISTRY.map(e => e.key);
await drizzle
  .delete(ConfigModel)
  .where(or(
    notInArray(ConfigModel.configKey, registryKeys),
    isNull(ConfigModel.value),
  ));

// Seed JWT secret on first bootstrap only — not overwritten on re-runs
await drizzle
  .insert(ConfigModel)
  .values({ configKey: "authentication.jwt.secret", value: randomBytes(32).toString("base64") })
  .onConflictDoNothing();

// ============================================================================
// Admin user
// ============================================================================

// No admin is seeded here. When the instance has no users, the app serves the
// registration screen and the first account to register is promoted to the
// platform administrator. See the `/register` handler in
// apps/api/src/routes/auth.routes.ts.

// eslint-disable-next-line no-console
console.log("Bootstrap complete.");
process.exit(0);
