import createConfig from "eslint-config/create-config";

export default createConfig(
  {
    ignores: ["env.d.ts"],
  },
  {
    files: ["__tests__/**/*.test.ts"],
    rules: {
      "import/first": "off",
    },
  },
);
