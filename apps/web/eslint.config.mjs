import pluginQuery from "@tanstack/eslint-plugin-query";

import createConfig from "@bunstack/eslint-config/create-config";

export default createConfig({
  react: true,
  ignores: ["src/routeTree.gen.ts", "src/components/react"],
}, {
  plugins: {
    "@tanstack/query": pluginQuery,
  },
  rules: {
    "@tanstack/query/exhaustive-deps": "error",
    "unicorn/filename-case": ["error", {
      case: "kebabCase",
      ignore: ["README.md", "~__root.tsx"],
    }],
  },
});
