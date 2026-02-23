import type { SeedMeta } from "./types";
import type { Policy } from "~shared/types/db/policies.types";
import type { Permission } from "~shared/types/permissions.types";

import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";

import { drizzle } from "~shared/drizzle";
import { PoliciesModel } from "~shared/models/policies.model";
import { RolesModel } from "~shared/models/roles.model";
import { RuntimeConfigModel } from "~shared/models/runtime-configs.model";
import { SeedsModel } from "~shared/models/seeds.model";
import { UserRolesModel } from "~shared/models/user-roles.model";
import { UsersModel } from "~shared/models/users.model";

// ============================================================================
// Checksum
// ============================================================================

function computeChecksum(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

// ============================================================================
// Seed Appliers
// ============================================================================

type RoleSeedData = Array<{
  name: string;
  label: string;
  description?: string;
  index: number;
  isDefault?: boolean;
  isSuperAdmin?: boolean;
}>;

type RuntimeConfigSeedData = Array<{
  configKey: string;
  value: string | null;
  type: "string" | "number" | "boolean" | "list";
  nullable: boolean;
  options?: string;
  disabledWhen?: string;
}>;

type PolicySeedData = Array<{
  effect: Policy["effect"];
  permission: Permission;
  roleId: number;
  condition: Policy["condition"];
}>;

type UserSeedData = Array<{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  metadata: object;
}>;

async function applyRolesSeed(data: RoleSeedData): Promise<void> {
  for (const role of data) {
    await drizzle
      .insert(RolesModel)
      .values(role)
      .onConflictDoNothing();
  }
}

async function applyRuntimeConfigsSeed(data: RuntimeConfigSeedData): Promise<void> {
  for (const config of data) {
    await drizzle
      .insert(RuntimeConfigModel)
      .values(config)
      .onConflictDoNothing();
  }
}

async function applyPoliciesSeed(data: PolicySeedData): Promise<void> {
  for (const policy of data) {
    await drizzle
      .insert(PoliciesModel)
      .values(policy)
      .onConflictDoNothing();
  }
}

async function applyUsersSeed(data: UserSeedData): Promise<void> {
  const usersWithCredentials = await Promise.all(
    data.map(async ({ roles, ...userData }) => {
      const passwordPlain = randomBytes(16).toString("base64url");
      const passwordHash = await Bun.password.hash(passwordPlain);

      return {
        userData: { ...userData, password: passwordHash },
        roles,
        credential: {
          email: userData.email,
          password: passwordPlain,
        },
      };
    }),
  );

  const allRoles = await drizzle.select().from(RolesModel);
  const rolesByName = new Map(allRoles.map(r => [r.name, r]));

  const defaultRole = allRoles.find(r => r.isDefault);

  const userRoleAssignments: Array<{ roleId: number; userId: string }> = [];
  const createdCredentials: Array<{ email: string; password: string }> = [];

  for (const { userData, roles, credential } of usersWithCredentials) {
    const [insertedUser] = await drizzle
      .insert(UsersModel)
      .values(userData)
      .onConflictDoNothing()
      .returning();

    if (!insertedUser) {
      continue;
    }

    createdCredentials.push(credential);

    for (const roleName of roles) {
      const role = rolesByName.get(roleName);

      if (role && role.id !== defaultRole?.id) {
        userRoleAssignments.push({
          roleId: role.id,
          userId: insertedUser.id,
        });
      }
    }
  }

  if (userRoleAssignments.length > 0) {
    await drizzle
      .insert(UserRolesModel)
      .values(userRoleAssignments)
      .onConflictDoNothing();
  }

  if (createdCredentials.length > 0) {
    // eslint-disable-next-line no-console
    console.info("Bootstrap users credentials:");
    for (const cred of createdCredentials) {
      // eslint-disable-next-line no-console
      console.info(`- ${cred.email} → ${cred.password}`);
    }
    // eslint-disable-next-line no-console
    console.info("Please store passwords securely and change them after first login.");
  }
}

// ============================================================================
// Seed Application Router
// ============================================================================

async function applySeed(seed: SeedMeta): Promise<void> {
  switch (seed.id) {
    case "roles":
      await applyRolesSeed(seed.data as RoleSeedData);
      break;
    case "runtime-configs":
      await applyRuntimeConfigsSeed(seed.data as RuntimeConfigSeedData);
      break;
    case "policies":
      await applyPoliciesSeed(seed.data as PolicySeedData);
      break;
    case "users":
      await applyUsersSeed(seed.data as UserSeedData);
      break;
    default:
      throw new Error(`Unknown seed id: ${seed.id}`);
  }
}

// ============================================================================
// Main Runner
// ============================================================================

export async function runSeeds(seeds: SeedMeta[]): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("🌱 Running seeds...");

  for (const seed of seeds) {
    const checksum = computeChecksum(seed.data);

    const [existing] = await drizzle
      .select()
      .from(SeedsModel)
      .where(eq(SeedsModel.id, seed.id));

    if (existing && existing.version === seed.version && existing.checksum === checksum) {
      // eslint-disable-next-line no-console
      console.log(`  ⏭️  Skipping seed: ${seed.id} (v${seed.version}) - already applied`);
      continue;
    }

    // eslint-disable-next-line no-console
    console.log(`  🌱 Applying seed: ${seed.id} (v${seed.version}) - ${seed.description}`);

    await drizzle.transaction(async (tx) => {
      await applySeed(seed);

      await tx
        .insert(SeedsModel)
        .values({
          id: seed.id,
          version: seed.version,
          checksum,
          appliedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: SeedsModel.id,
          set: {
            version: seed.version,
            checksum,
            appliedAt: new Date().toISOString(),
          },
        });
    });
  }

  // eslint-disable-next-line no-console
  console.log("🌱 Seeds complete.");
}
