import { drizzle as drizzleClient } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// eslint-disable-next-line node/no-process-env
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(DATABASE_URL);
export const drizzle = drizzleClient(client);
