import { defineConfig } from "vitest/config";

/**
 * vitest — только unit-слой src (zod-схемы, инварианты данных, qa.md № 3).
 * Playwright-спеки e2e/ остаются playwright'у (npm run test:e2e), серверный
 * контракт contact.py — unittest (npm run test:server).
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
