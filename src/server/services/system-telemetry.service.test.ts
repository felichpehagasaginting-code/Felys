import { describe, it, expect } from "vitest";
import { SystemTelemetryService } from "./system-telemetry.service";

describe("SystemTelemetryService", () => {
  it("generates a valid system health report structure without leaking secrets", () => {
    const report = SystemTelemetryService.getHealthReport();

    expect(report).toBeDefined();
    expect(["healthy", "degraded"]).toContain(report.status);
    expect(report.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(report.runtime.nodeVersion).toBeDefined();
    expect(report.runtime.memoryMb.heapUsed).toBeGreaterThan(0);
    expect(report.services.rateLimiter.status).toBe("active");
    expect(typeof report.services.geminiAi.configured).toBe("boolean");
    expect(typeof report.services.firebaseAdmin.configured).toBe("boolean");

    // Pastikan tidak ada raw API key string yang bocor di dalam payload report
    const jsonString = JSON.stringify(report);
    expect(jsonString).not.toContain("AIzaSy");
    expect(jsonString).not.toContain("BEGIN PRIVATE KEY");
  });
});
