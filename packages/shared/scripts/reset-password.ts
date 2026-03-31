import { isNotNull, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const { drizzle } = await import("../src/drizzle");
const { UsersModel } = await import("../src/models/users.model");

const [systemUser] = await drizzle
  .select()
  .from(UsersModel)
  .where(isNotNull(sql`metadata->>'system'`))
  .limit(1);

if (!systemUser) {
  console.error("No system admin found. Run bootstrap first.");
  process.exit(1);
}

const password = randomBytes(6).toString("base64url");
const passwordHash = await Bun.password.hash(password);

await drizzle
  .update(UsersModel)
  .set({ password: passwordHash })
  .where(isNotNull(sql`metadata->>'system'`));

// eslint-disable-next-line no-console
console.info(`Admin credentials: ${systemUser.email} → ${password}`);
// eslint-disable-next-line no-console
console.info("Store the password securely and change it after first login.");
process.exit(0);
