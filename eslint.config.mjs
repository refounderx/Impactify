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
    files: ["scripts/generate-ngo-donor-guide.js"],
    rules: {
      // This standalone Node script is CommonJS because its docx runtime is
      // loaded from the bundled workspace dependency path.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
