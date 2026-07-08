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
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/react-router"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~api": path.resolve(__dirname, "../../apps/api/src"),
      "~app-core": path.resolve(__dirname, "../../packages/app-core/src"),
      "~orbit": path.resolve(__dirname, "../../packages/orbit/src"),
      "~shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    host: true,
    // The admin app is served on admin.BASE_DOMAIN
    allowedHosts: [".lvh.me", ".localhost"],
    proxy: {
      "/api": {
        // Keep the original Host header — the API resolves the platform surface from it
        target: "http://localhost:3000",
        changeOrigin: false,
        rewrite: path => path.replace(/^\/api/, ""),
      },
    },
  },
}));
