import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bunstack/api": path.resolve(__dirname, "../api/src"),
      "@bunstack/i18n": path.resolve(__dirname, "../../packages/i18n/src"),
      "@bunstack/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@bunstack/react": path.resolve(__dirname, "../../packages/react/src"),
    },
  },
  server: {
    port: 4002,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ""),
      },
    },
  },
}));
