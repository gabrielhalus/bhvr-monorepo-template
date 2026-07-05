import createConfig from "eslint-config/create-config";

const base = await createConfig({ tailwind: true });

export default [
  ...(Array.isArray(base) ? base : [base]),
  {
    rules: {
      // Orbit follows the shadcn convention of PascalCase component filenames
      // (Button.tsx, Card.tsx, …). Keep it as the design system ships it.
      "unicorn/filename-case": "off",
      // Vendored design-system primitives ship with these patterns (forward
      // references between composable parts, inline ternaries). Keep upstream.
      "ts/no-use-before-define": "off",
      "style/multiline-ternary": "off",
    },
  },
];
