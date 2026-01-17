const { defineConfig } = require("drizzle-kit");
require("dotenv").config({ path: "../../.env" });

module.exports = defineConfig({
  schema: "./src/models/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // eslint-disable-next-line node/no-process-env
    url: process.env.DATABASE_URL,
  },
});
