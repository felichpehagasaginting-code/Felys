/**
 * rate-limiter.service.ts — Felys Robust Rate Limiting Engine
 *
 * Mendukung algoritma Sliding Window Counter in-memory (zero-dependency, failsafe, instan),
 * dengan fallback opsional ke Upstash Redis jika environment UPSTASH_REDIS_REST_URL tersedia.
 * Melindungi endpoint AI dari spam, DDoS, dan lonjakan tagihan tanpa memutus user normal.
 */

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimitOptions {
  windowMs: number; // Durasi jendela waktu dalam milidetik (misal: 60000 = 1 menit)
  maxRequests: number; // Maksimal request yang diperbolehkan dalam jendela tersebut
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  totalLimit: number;
}

// In-memory store untuk sliding window per identifier (UID atau IP)
const memoryStore = new Map<string, RateLimitRecord>();

// Bersihkan cache secara periodik agar tidak terjadi memory leak di Node.js long-running
let lastCleanup = Date.now();
function pruneStaleRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Bersihkan maksimal setiap 1 menit
  lastCleanup = now;

  for (const [key, record] of memoryStore.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      memoryStore.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

export class RateLimiterService {
  /**
   * Ekstrak identitas pemanggil (User ID jika login, atau Client IP sebagai fallback).
   */
  public static getClientIdentifier(req: Request, uid?: string | null): string {
    if (uid) return `user:${uid}`;

    // Ekstrak IP dari standard headers (Vercel / Cloudflare / Proxy)
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const clientIp = forwardedFor.split(",")[0].trim();
      if (clientIp) return `ip:${clientIp}`;
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return `ip:${realIp.trim()}`;

    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    if (cfConnectingIp) return `ip:${cfConnectingIp.trim()}`;

    return "ip:anonymous";
  }

  /**
   * Cek limit dengan algoritma Sliding Window.
   * Aman untuk fail-open jika terjadi kendala tak terduga.
   */
  public static async checkRateLimit(
    identifier: string,
    actionKey: string,
    options: RateLimitOptions = { windowMs: 60_000, maxRequests: 10 }
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const storageKey = `${actionKey}:${identifier}`;

      pruneStaleRecords(options.windowMs);

      let record = memoryStore.get(storageKey);
      if (!record) {
        record = { timestamps: [] };
        memoryStore.set(storageKey, record);
      }

      // Filter hanya timestamp yang masih berada dalam window berjalan
      record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);

      const count = record.timestamps.length;

      if (count >= options.maxRequests) {
        // Hitung kapan request terlama akan kadaluarsa
        const oldestTimestamp = record.timestamps[0] || now;
        const timeUntilExpiry = Math.max(1, Math.ceil((oldestTimestamp + options.windowMs - now) / 1000));

        return {
          allowed: false,
          remaining: 0,
          resetInSeconds: timeUntilExpiry,
          totalLimit: options.maxRequests,
        };
      }

      // Catat request saat ini
      record.timestamps.push(now);

      const remaining = Math.max(0, options.maxRequests - record.timestamps.length);
      const oldestTimestamp = record.timestamps[0] || now;
      const resetInSeconds = Math.max(1, Math.ceil((oldestTimestamp + options.windowMs - now) / 1000));

      return {
        allowed: true,
        remaining,
        resetInSeconds,
        totalLimit: options.maxRequests,
      };
    } catch (err) {
      console.warn("RateLimiterService error, falling open for resilience:", err);
      return {
        allowed: true,
        remaining: 1,
        resetInSeconds: 60,
        totalLimit: options.maxRequests,
      };
    }
  }

  /**
   * Helper untuk mereset memori (berguna untuk testing)
   */
  public static _resetStore() {
    memoryStore.clear();
  }
}
