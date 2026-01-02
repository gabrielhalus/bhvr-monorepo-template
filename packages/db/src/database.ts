import { drizzle as drizzleClient } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@bunstack/db/lib/env";

const client = postgres(env.DATABASE_URL);
export const drizzle = drizzleClient(client);
