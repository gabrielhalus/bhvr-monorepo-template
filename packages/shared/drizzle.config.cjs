const { defineConfig } = require("drizzle-kit");
const { resolve } = require("node:path");

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
