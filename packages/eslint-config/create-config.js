import { fileURLToPath } from "node:url";

import antfu from "@antfu/eslint-config";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";

// Absolute path to the Tailwind v4 CSS entry point, resolved relative to this
// package so it works regardless of the cwd each app lints from.
const tailwindEntryPoint = fileURLToPath(
  new URL("../orbit/src/styles.css", import.meta.url),
);

export default function createConfig(options, ...userConfigs) {
  // `tailwind` is a local option (not forwarded to antfu): enable it only in
  // packages that actually use Tailwind (web, react) to avoid a spurious
  // "Tailwind CSS is not installed" warning in api/shared.
  const { tailwind = false, ...antfuOptions } = options ?? {};

  return antfu(
    {
      type: "app",
      typescript: true,
      formatters: true,
      stylistic: {
        indent: 2,
        semi: true,
        quotes: "double",
        braceStyle: "1tbs",
      },
      ...antfuOptions,
    },
    ...(tailwind
      ? [{
          plugins: {
            "better-tailwindcss": betterTailwindcss,
          },
          settings: {
            "better-tailwindcss": {
              entryPoint: tailwindEntryPoint,
              // Lets the canonical rule map px arbitrary values onto the scale,
              // e.g. `max-w-[560px]` -> `max-w-140` (560px / 16 = 35rem).
              rootFontSize: 16,
            },
          },
          rules: {
            // Rewrite arbitrary values to their canonical scale shorthand,
            // e.g. `max-w-[560px]` -> `max-w-140`. Auto-fixable via `lint --fix`.
            "better-tailwindcss/enforce-canonical-classes": "warn",
            // Collapse redundant whitespace left in class strings (companion to
            // the canonical rewrite, which can merge two classes into one).
            "better-tailwindcss/no-unnecessary-whitespace": "warn",
          },
        }]
      : []),
    {
      rules: {
        "style/brace-style": ["error", "1tbs", { allowSingleLine: true }],
        "curly": "off",
        "antfu/if-newline": "off",
        "style/nonblock-statement-body-position": ["error", "beside"],
        "ts/consistent-type-definitions": ["error", "type"],
        "no-console": ["warn"],
        "antfu/no-top-level-await": ["off"],
        "node/prefer-global/process": ["off"],
        "node/no-process-env": ["error"],
        "perfectionist/sort-imports": [
          "error",
          {
            tsconfigRootDir: ".",
            groups: [
              "type",
              ["builtin", "external"],
              "internal",
              ["parent", "sibling", "index"],
            ],
            internalPattern: ["^@bunstack/", "^@/", "^~"],
            newlinesBetween: "always",
          },
        ],
        "unicorn/filename-case": [
          "error",
          {
            case: "kebabCase",
            ignore: ["README.md"],
          },
        ],
      },
    },
    ...userConfigs,
  );
}
