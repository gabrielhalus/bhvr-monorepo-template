import { isNull, notInArray, or } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const { drizzle } = await import("../src/drizzle");
const { CONFIG_REGISTRY } = await import("../src/config.registry");
const { PoliciesModel } = await import("../src/models/policies.model");
const { RolesModel } = await import("../src/models/roles.model");
const { ConfigModel } = await import("../src/models/configs.model");

// ============================================================================
// Roles
// ============================================================================

await drizzle
  .insert(RolesModel)
  .values([
    { name: "admin", index: 100, isDefault: false, isSuperAdmin: true },
    { name: "user", index: 10, isDefault: true, isSuperAdmin: false },
  ])
  .onConflictDoNothing();

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
  .values({ configKey: "security.jwt.secret", value: randomBytes(32).toString("base64") })
  .onConflictDoNothing();

// ============================================================================
// Policies
// ============================================================================

await drizzle
  .insert(PoliciesModel)
  .values([
    {
      effect: "allow",
      permission: "user:update",
      roleId: 2,
      condition: JSON.stringify({
        op: "eq",
        left: { type: "user_attr", key: "id" },
        right: { type: "resource_attr", key: "id" },
      }),
    },
  ])
  .onConflictDoNothing();

// ============================================================================
// Admin user
// ============================================================================

// No admin is seeded here. When the instance has no users, the app serves the
// registration screen and the first account to register is promoted to the
// system administrator (admin role + `metadata.system`). See the `/register`
// handler in apps/api/src/routes/auth.routes.ts.

// eslint-disable-next-line no-console
console.log("Bootstrap complete.");
process.exit(0);
