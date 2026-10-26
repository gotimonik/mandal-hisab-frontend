import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a running frontend (E2E_BASE_URL, default http://localhost:3000)
 * connected to a running API with a seeded platform admin (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD).
 * Use a disposable database: the tests create organizations, members and payments.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
