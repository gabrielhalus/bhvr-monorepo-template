import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

/**
 * Short hash of the commit being built. Resolution order:
 *   1. `BUILD_HASH` env — explicit override (CI / Docker ARG).
 *   2. The repo's `.git`, read directly from the filesystem. No git binary is
 *      required (the build image has none) — `.git` is shipped in the Docker
 *      build context so this resolves automatically at build time.
 *   3. `"dev"` as a last resort.
 */
function getBuildHash(): string {
  // eslint-disable-next-line node/no-process-env
  if (process.env.BUILD_HASH) return process.env.BUILD_HASH;

  try {
    let dir = process.cwd();
    for (;;) {
      const gitDir = path.join(dir, ".git");
      if (fs.existsSync(gitDir)) return resolveGitHead(gitDir);
      const parent = path.dirname(dir);
      if (parent === dir) break; // reached filesystem root
      dir = parent;
    }
  } catch {
    // fall through to "dev"
  }
  return "dev";
}

/** Resolve `.git/HEAD` to a 7-char SHA, handling detached HEAD, loose and packed refs. */
function resolveGitHead(gitDir: string): string {
  const head = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
  if (!head.startsWith("ref:")) return head.slice(0, 7); // detached HEAD

  const ref = head.slice(4).trim(); // e.g. "refs/heads/main"

  const loose = path.join(gitDir, ref);
  if (fs.existsSync(loose)) return fs.readFileSync(loose, "utf8").trim().slice(0, 7);

  const packed = path.join(gitDir, "packed-refs");
  if (fs.existsSync(packed)) {
    for (const line of fs.readFileSync(packed, "utf8").split("\n")) {
      if (line.endsWith(` ${ref}`)) return line.slice(0, 7);
    }
  }
  return "dev";
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
