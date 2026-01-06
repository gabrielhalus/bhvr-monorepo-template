import drizzle from "eslint-plugin-drizzle";

import createConfig from "@bunstack/eslint-config/create-config";

export default createConfig({
  ignores: ["./migrations/*"],
  plugins: { drizzle },
  rules: {
    ...drizzle.configs.recommended.rules,
  },
});
