import { test, expect } from "@playwright/test";

test.describe("System Health & Diagnostics API (E2E)", () => {
  test("GET /api/system/health returns 200 with operational metrics", async ({ request }) => {
    const res = await request.get("/api/system/health");
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(data.runtime.nodeVersion).toBeDefined();
    expect(data.runtime.memoryMb.heapUsed).toBeGreaterThan(0);
    expect(data.services.rateLimiter.status).toBe("active");

    // Pastikan tidak ada raw token/kunci yang bocor di respons HTTP
    const bodyText = JSON.stringify(data);
    expect(bodyText).not.toContain("AIzaSy");
    expect(bodyText).not.toContain("BEGIN PRIVATE KEY");
  });

  test("GET /api/system/health handles repeated calls gracefully", async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.get("/api/system/health");
      expect(res.status()).toBe(200);
    }
  });
});
