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
      "~auth": path.resolve(__dirname, "../../packages/auth/src"),
      "~db": path.resolve(__dirname, "../../packages/db/src"),
      "~env": path.resolve(__dirname, "../../packages/env/src"),
      "~i18n": path.resolve(__dirname, "../../packages/i18n/src"),
      "~react": path.resolve(__dirname, "../../packages/react/src"),
      "~shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ""),
      },
    },
  },
}));
