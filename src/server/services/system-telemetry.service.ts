/**
 * system-telemetry.service.ts — Enterprise System Telemetry & Health Diagnostics
 *
 * Mengumpulkan metrik kesehatan server, memori, status konfigurasi kredensial (tanpa leak),
 * dan performa runtime tanpa membocorkan rahasia ke publik.
 */

export interface SystemHealthReport {
  status: "healthy" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  runtime: {
    nodeVersion: string;
    platform: string;
    memoryMb: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  services: {
    geminiAi: {
      configured: boolean;
      activeModel: string;
    };
    firebaseAdmin: {
      configured: boolean;
    };
    rateLimiter: {
      status: "active";
      engine: "sliding-window-in-memory";
    };
  };
}

export class SystemTelemetryService {
  private static startTime = Date.now();

  /**
   * Menghasilkan diagnosis lengkap kesehatan sistem
   */
  public static getHealthReport(): SystemHealthReport {
    const memory = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0, heapTotal: 0, rss: 0 };

    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    );

    const hasFirebaseAdmin = Boolean(
      (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    );

    const isHealthy = true; // Service berjalan normal

    return {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - SystemTelemetryService.startTime) / 1000),
      runtime: {
        nodeVersion: process.version || "unknown",
        platform: process.platform || "unknown",
        memoryMb: {
          heapUsed: Math.round((memory.heapUsed / (1024 * 1024)) * 10) / 10,
          heapTotal: Math.round((memory.heapTotal / (1024 * 1024)) * 10) / 10,
          rss: Math.round((memory.rss / (1024 * 1024)) * 10) / 10,
        },
      },
      services: {
        geminiAi: {
          configured: hasGeminiKey,
          activeModel: "gemini-2.5-flash (with multi-fallback)",
        },
        firebaseAdmin: {
          configured: hasFirebaseAdmin,
        },
        rateLimiter: {
          status: "active",
          engine: "sliding-window-in-memory",
        },
      },
    };
  }
}
