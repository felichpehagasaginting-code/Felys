import { NextResponse } from "next/server";
import { SystemTelemetryService } from "@/server/services/system-telemetry.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const report = SystemTelemetryService.getHealthReport();
    return NextResponse.json(report, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        error: error.message || "Internal health check error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
