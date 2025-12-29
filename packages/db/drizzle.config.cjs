const { defineConfig } = require("drizzle-kit");
require("dotenv").config({ path: ".env.local" });

module.exports = defineConfig({
  schema: "../shared/src/models/*.model.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // eslint-disable-next-line node/no-process-env
    url: process.env.DATABASE_URL,
  },
});
