import createConfig from "eslint-config/create-config";

export default createConfig(
  {},
  {
    files: ["__tests__/**/*.test.ts"],
    rules: {
      "import/first": "off",
    },
  },
);
