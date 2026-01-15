import type { SeedMeta } from "./types";

import { createHash } from "crypto";
import { eq } from "drizzle-orm";

import { RolesModel } from "~shared/db/models/roles.model";
import { RuntimeConfigModel } from "~shared/db/models/runtime-configs.model";
import { SeedsModel } from "~shared/db/models/seeds.model";
import { drizzle } from "~shared/drizzle";

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
