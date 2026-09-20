import { defineConfig, devices } from "@playwright/test";

const consoleSpec = "**/console.spec.ts";

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3000" },
    },
    {
      // React and Radix print their warnings only in a development build, so the
      // console check also runs against `next dev`.
      name: "dev-console",
      testMatch: consoleSpec,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3100" },
    },
  ],
  webServer: [
    {
      // CI builds in an earlier step.
      command: process.env.CI ? "pnpm start" : "pnpm build && pnpm start",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "pnpm exec next dev -p 3100",
      url: "http://localhost:3100",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
