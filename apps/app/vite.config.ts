import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import path from "node:path";
import { defineConfig } from "vite";

/**
 * Short hash of the commit being built — from BUILD_HASH in Docker (no .git in
 * the build context), from git locally, "dev" as a last resort.
 */
function getBuildHash(): string {
  // eslint-disable-next-line node/no-process-env
  if (process.env.BUILD_HASH) return process.env.BUILD_HASH;
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

// https://vite.dev/config/
export default defineConfig(() => ({
  define: {
    __BUILD_HASH__: JSON.stringify(getBuildHash()),
  },
  plugins: [
    varlockVitePlugin(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/react-router", "next-themes"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~api": path.resolve(__dirname, "../../apps/api/src"),
      "~auth": path.resolve(__dirname, "../../packages/auth/src"),
      "~db": path.resolve(__dirname, "../../packages/db/src"),
      "~env": path.resolve(__dirname, "../../packages/env/src"),
      "~i18n": path.resolve(__dirname, "../../packages/i18n/src"),
      "~orbit": path.resolve(__dirname, "../../packages/orbit/src"),
      "~shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ""),
      },
    },
  },
}));
