/**
 * Playwright config — runs the smoke spec headlessly in CI.
 * Use `npx playwright test` locally or via GitHub Actions.
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /(^|\/)smoke\.spec\.mjs$/,
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    headless: true,
    viewport: { width: 1024, height: 768 },
    actionTimeout: 8_000
  }
});
