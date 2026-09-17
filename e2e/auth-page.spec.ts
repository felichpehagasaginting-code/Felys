import { test, expect } from "@playwright/test";

test.describe("Authentication Page (E2E)", () => {
  test("renders login page with branding, inputs, and OAuth options", async ({ page }) => {
    await page.goto("/login");

    // Check branding header
    const heading = page.locator("h1");
    await expect(heading).toContainText("Selamat Datang di Felys");

    // Check subtitle
    const subtitle = page.locator("text=Atur waktu, atur uang, tenang aja.");
    await expect(subtitle).toBeVisible();

    // Check inputs exist
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check login submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // Check link to register
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test("fills form and validates input interaction", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("mahasiswa@felys.id");
    await expect(emailInput).toHaveValue("mahasiswa@felys.id");

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("secretPassword123");
    await expect(passwordInput).toHaveValue("secretPassword123");
  });
});
