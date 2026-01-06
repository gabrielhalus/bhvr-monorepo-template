import { drizzle as drizzleClient } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import { validateEnv } from "./env";

const env = validateEnv({
  DATABASE_URL: z.string(),
});

const client = postgres(env.DATABASE_URL);
export const drizzle = drizzleClient(client);
