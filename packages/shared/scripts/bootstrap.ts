import { eq, sql, isNotNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const { drizzle } = await import("../src/drizzle");
const { PoliciesModel } = await import("../src/models/policies.model");
const { RolesModel } = await import("../src/models/roles.model");
const { RuntimeConfigModel } = await import("../src/models/runtime-configs.model");
const { UserRolesModel } = await import("../src/models/user-roles.model");
const { UsersModel } = await import("../src/models/users.model");

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

await drizzle
  .insert(RuntimeConfigModel)
  .values([
    { configKey: "authentication.register.enable", value: "false", type: "boolean", nullable: false, order: 0 },
    { configKey: "authentication.google.enable", value: "false", type: "boolean", nullable: false, order: 0 },
    { configKey: "authentication.google.clientId", value: null, type: "string", nullable: true, order: 1, disabledWhen: "authentication.google.enable!=true" },
    { configKey: "authentication.google.clientSecret", value: null, type: "string", nullable: true, order: 2, disabledWhen: "authentication.google.enable!=true" },
    { configKey: "notifications.discord.enable", value: "false", type: "boolean", nullable: false, order: 0 },
    { configKey: "notifications.discord.url", value: null, type: "string", nullable: true, order: 1, disabledWhen: "notifications.discord.enable!=true" },
    { configKey: "notifications.smtp.enable", value: "false", type: "boolean", nullable: false, order: 0 },
    { configKey: "notifications.smtp.host", value: null, type: "string", nullable: true, order: 1, disabledWhen: "notifications.smtp.enable!=true" },
    { configKey: "notifications.smtp.port", value: null, type: "number", nullable: true, order: 2, disabledWhen: "notifications.smtp.enable!=true" },
    { configKey: "notifications.smtp.user", value: null, type: "string", nullable: true, order: 3, disabledWhen: "notifications.smtp.enable!=true" },
    { configKey: "notifications.smtp.password", value: null, type: "string", nullable: true, order: 4, disabledWhen: "notifications.smtp.enable!=true" },
    { configKey: "notifications.smtp.fromAddress", value: null, type: "string", nullable: true, order: 4, disabledWhen: "notifications.smtp.enable!=true" },
  ])
  .onConflictDoUpdate({
    target: RuntimeConfigModel.configKey,
    set: {
      type: sql`excluded.type`,
      nullable: sql`excluded.nullable`,
      order: sql`excluded.order`,
      options: sql`excluded.options`,
      disabledWhen: sql`excluded.disabled_when`,
    },
  });

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

const [existingSystemUser] = await drizzle
  .select()
  .from(UsersModel)
  .where(isNotNull(sql`metadata->>'system'`))
  .limit(1);

if (existingSystemUser) {
  // eslint-disable-next-line no-console
  console.info("Bootstrap: system admin already exists, skipping admin creation.");
} else {
  const password = randomBytes(6).toString("base64url");
  const passwordHash = await Bun.password.hash(password);

  const [insertedAdmin] = await drizzle
    .insert(UsersModel)
    .values({
      firstName: "System",
      lastName: "Administrator",
      email: "admin",
      password: passwordHash,
      metadata: { system: true },
    })
    .onConflictDoNothing()
    .returning();

  if (insertedAdmin) {
    const [adminRole] = await drizzle
      .select()
      .from(RolesModel)
      .where(eq(RolesModel.name, "admin"));

    if (adminRole) {
      await drizzle
        .insert(UserRolesModel)
        .values({ userId: insertedAdmin.id, roleId: adminRole.id })
        .onConflictDoNothing();
    }

    // eslint-disable-next-line no-console
    console.info(`Bootstrap admin credentials: admin → ${password}`);
    // eslint-disable-next-line no-console
    console.info("Store the password securely and change it after first login.");
  }
}

// eslint-disable-next-line no-console
console.log("Bootstrap complete.");
process.exit(0);
