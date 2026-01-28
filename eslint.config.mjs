import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Flag explicit `any` — warn for now, error once types are generated
      "@typescript-eslint/no-explicit-any": "warn",
      // Flag console usage — warn to encourage proper error handling
      "no-console": "warn",
    },
  },
]);

export default eslintConfig;
