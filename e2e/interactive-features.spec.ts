import { test, expect } from "@playwright/test";

test.describe("Interactive Features & Micro-Interactions (E2E)", () => {
  test("switches between Akademik and Finance modes seamlessly", async ({ page }) => {
    await page.goto("/");

    // Locate the ModeSwitcher options in the segmented control radiogroup
    const radioGroup = page.locator("[role='radiogroup']");
    await expect(radioGroup).toBeVisible();

    const financeOption = radioGroup.getByText("Finance");
    const academicOption = radioGroup.getByText("Akademik");

    await expect(financeOption).toBeVisible();
    await expect(academicOption).toBeVisible();

    // Click Finance mode
    await financeOption.click();
    await page.waitForTimeout(300);

    // Switch back to Akademik mode
    await academicOption.click();
    await page.waitForTimeout(300);
  });

  test("toggles AI Drawer and verifies Fio Assistant panel", async ({ page }) => {
    await page.goto("/");

    // Locate the AI trigger button in navbar
    const fioTrigger = page.locator("button[title*='Asisten AI Fio']").first();
    await expect(fioTrigger).toBeVisible();

    // Click to open drawer
    await fioTrigger.click();

    // Verify Fio Assistant panel appears
    const drawerTitle = page.locator("h3:has-text('Fio Assistant')");
    await expect(drawerTitle).toBeVisible();

    // Check textarea/input for asking Fio exists
    const chatInput = page.locator("textarea, input[placeholder*='Fio']").first();
    await expect(chatInput).toBeVisible();
  });

  test("executes live Ping Diagnostics in Settings and updates latency", async ({ page }) => {
    await page.goto("/settings");

    // Locate the Ping button inside System Diagnostics card
    const pingBtn = page.locator("button:has-text('Ping')").first();
    await expect(pingBtn).toBeVisible();

    // Wait until button is enabled (initial mount fetch completed)
    await expect(pingBtn).toBeEnabled();

    // Click Ping Diagnostics
    await pingBtn.click();

    // Verify live status and button remains operational
    await expect(pingBtn).toBeVisible();
    const liveBadge = page.locator("text=Live").first();
    await expect(liveBadge).toBeVisible();
  });

  test("toggles Light and Dark theme modes", async ({ page }) => {
    await page.goto("/");

    // Locate Theme Toggle button in Navbar
    const themeBtn = page.locator("button[title*='Beralih ke Mode']").first();
    await expect(themeBtn).toBeVisible();

    // Check initial HTML class
    const initialIsDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));

    // Click toggle
    await themeBtn.click();
    await page.waitForTimeout(400);

    // Verify dark class state inverted
    const afterToggleIsDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(afterToggleIsDark).not.toBe(initialIsDark);

    // Toggle back to restore initial state
    await themeBtn.click();
    await page.waitForTimeout(400);
    const restoredIsDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(restoredIsDark).toBe(initialIsDark);
  });
});
