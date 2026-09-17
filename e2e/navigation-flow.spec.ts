import { test, expect } from "@playwright/test";

test.describe("App Navigation & Layout (E2E)", () => {
  test("loads main dashboard page and checks header presence", async ({ page }) => {
    await page.goto("/");

    // Dashboard should load without unhandled crashes
    await expect(page).toHaveTitle(/Felys/i);

    // Navbar or brand container should be present
    const brand = page.locator("text=Felys").first();
    await expect(brand).toBeVisible();
  });

  test("navigates to settings page and finds System Diagnostics card", async ({ page }) => {
    await page.goto("/settings");

    // Check settings heading
    const heading = page.locator("h1");
    await expect(heading).toContainText(/Pengaturan/i);

    // Check System Diagnostics & AI Guardrails card is rendered
    const diagnosticsTitle = page.locator("text=System Diagnostics & AI Guardrails");
    await expect(diagnosticsTitle).toBeVisible();

    // Check Ping Diagnostics button exists
    const pingBtn = page.locator("text=Ping").first();
    await expect(pingBtn).toBeVisible();
  });
});
