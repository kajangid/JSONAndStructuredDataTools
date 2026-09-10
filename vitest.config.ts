import { defineConfig } from "vitest/config";
import * as fs from "node:fs";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

export default defineConfig({
  define: {
    __PACKAGE_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "src/bin/**",
        "src/index.ts",
        "src/shared/types.ts",
        "tsup.config.ts",
        "vitest.config.ts",
      ],
    },
  },
});
