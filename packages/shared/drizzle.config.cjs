const { resolve } = require("node:path");
const { defineConfig } = require("drizzle-kit");

// In Docker, env vars are injected by docker compose env_file.
// In local dev, load from monorepo root .env file.
/* eslint-disable-next-line node/no-process-env */
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: resolve(__dirname, "../../.env") });
}

module.exports = defineConfig({
  schema: "./src/models/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // eslint-disable-next-line node/no-process-env
    url: process.env.DATABASE_URL,
  },
});
