import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const forbid = (files, layers) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: layers.map((layer) => ({
          group: [`@/${layer}`, `@/${layer}/**`],
          message: `This layer must not import from ${layer}/ (see docs/ARCHITECTURE.md).`,
        })),
      },
    ],
  },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  forbid(["src/lib/**"], ["app", "core", "features", "shared", "services"]),
  forbid(["src/shared/**"], ["app", "core", "features", "services"]),
  forbid(["src/services/**"], ["app", "core", "features"]),
  forbid(["src/features/**"], ["app", "core"]),
  forbid(["src/core/**"], ["app"]),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
