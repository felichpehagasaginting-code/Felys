import { defineConfig, devices } from "@playwright/test";
import path from "path";

// Enforce Playwright browser binaries to live strictly on Drive F:
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(__dirname, ".playwright-browsers");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // 2 workers di lokal agar dev server Next.js tidak kewalahan saat watch mode
  timeout: 30_000,
  expect: {
    timeout: 10_000, // Beri waktu 10 detik agar Next.js on-demand compilation selesai tanpa timeout
  },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
