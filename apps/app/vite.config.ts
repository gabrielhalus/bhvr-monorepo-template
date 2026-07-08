import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(() => ({
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
      "~app-core": path.resolve(__dirname, "../../packages/app-core/src"),
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
    // Tenant domains in dev: {slug}.lvh.me / {slug}.localhost resolve to 127.0.0.1
    allowedHosts: [".lvh.me", ".localhost"],
    proxy: {
      "/api": {
        // Keep the original Host header — the API resolves the organization from it
        target: "http://localhost:3000",
        changeOrigin: false,
        rewrite: path => path.replace(/^\/api/, ""),
      },
    },
  },
}));
