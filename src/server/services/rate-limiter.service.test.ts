import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiterService } from "./rate-limiter.service";

describe("RateLimiterService", () => {
  beforeEach(() => {
    RateLimiterService._resetStore();
  });

  it("allows requests up to the maxRequests limit", async () => {
    const opts = { windowMs: 1000, maxRequests: 3 };
    const id = "user:test-1";

    const res1 = await RateLimiterService.checkRateLimit(id, "chat", opts);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await RateLimiterService.checkRateLimit(id, "chat", opts);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await RateLimiterService.checkRateLimit(id, "chat", opts);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // Keempat harus diblokir (429)
    const res4 = await RateLimiterService.checkRateLimit(id, "chat", opts);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetInSeconds).toBeGreaterThan(0);
  });

  it("isolates rate limits between different users", async () => {
    const opts = { windowMs: 1000, maxRequests: 2 };

    await RateLimiterService.checkRateLimit("user:A", "chat", opts);
    await RateLimiterService.checkRateLimit("user:A", "chat", opts);
    const resA = await RateLimiterService.checkRateLimit("user:A", "chat", opts);
    expect(resA.allowed).toBe(false);

    // User B harus tetap diperbolehkan
    const resB = await RateLimiterService.checkRateLimit("user:B", "chat", opts);
    expect(resB.allowed).toBe(true);
    expect(resB.remaining).toBe(1);
  });

  it("extracts client identifier from headers correctly", () => {
    // When UID exists
    const reqWithUid = new Request("http://localhost");
    expect(RateLimiterService.getClientIdentifier(reqWithUid, "uid-123")).toBe("user:uid-123");

    // When X-Forwarded-For exists
    const reqWithIp = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(RateLimiterService.getClientIdentifier(reqWithIp, null)).toBe("ip:203.0.113.195");

    // When anonymous without IP header
    const reqAnon = new Request("http://localhost");
    expect(RateLimiterService.getClientIdentifier(reqAnon, null)).toBe("ip:anonymous");
  });
});
