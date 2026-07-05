import createConfig from "eslint-config/create-config";
import drizzle from "eslint-plugin-drizzle";

export default createConfig(
  {
    ignores: ["./migrations/*"],
    plugins: { drizzle },
    rules: {
      ...drizzle.configs.recommended.rules,
    },
  },
  {
    files: ["src/i18n/i18next.d.ts"],
    rules: {
      "ts/consistent-type-definitions": "off",
    },
  },
  {
    files: ["__tests__/**/*.test.ts"],
    rules: {
      "import/first": "off",
    },
  },
);
