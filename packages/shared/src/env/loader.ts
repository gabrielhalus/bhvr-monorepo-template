import { config } from "dotenv";
import { resolve } from "node:path";

/**
 * Loads .env files in Vite's cascade order.
 * Later files take priority; already-set env vars (e.g. from Docker) are never overridden.
 *
 * @param mode - The environment mode (e.g., "development", "production")
 * @param envDir - The directory containing .env files (typically the monorepo root)
 */
export function loadEnv(mode: string, envDir: string): void {
  const files = [
    ".env",
    `.env.${mode}`,
    ".env.local",
    `.env.${mode}.local`,
  ];

  for (const file of files) {
    config({ path: resolve(envDir, file), override: false });
  }
}
