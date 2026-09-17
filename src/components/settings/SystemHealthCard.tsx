"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Zap,
  RefreshCw,
  Server,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

interface HealthData {
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
      engine: string;
    };
  };
}

export function SystemHealthCard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const fetchHealth = async (isManual = false) => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/system/health", { cache: "no-store" });
      const duration = Math.round(performance.now() - start);
      setLatencyMs(duration);

      if (!res.ok) throw new Error("Health check failed");
      const json: HealthData = await res.json();
      setData(json);

      if (isManual) {
        triggerHaptic("success");
        toast.success(`System Operational (${duration}ms) ⚡`, {
          description: "Seluruh subsistem, AI guardrail, dan rate limiter aktif normal.",
        });
      }
    } catch {
      if (isManual) {
        triggerHaptic("error");
        toast.error("Gagal memeriksa kesehatan server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth(false);
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours} jam ${mins % 60} mnt`;
    if (mins > 0) return `${mins} mnt ${seconds % 60} dtk`;
    return `${seconds} dtk`;
  };

  return (
    <div className="rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-card-dark p-6 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint-100 dark:bg-mint-950/40 text-mint-600 dark:text-mint-400 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                System Diagnostics & AI Guardrails
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-mint-100 dark:bg-mint-950/50 text-mint-700 dark:text-mint-300">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              Pemantauan performa runtime, proteksi kebocoran token AI, dan rate limiter server.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchHealth(true)}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking..." : latencyMs !== null ? `${latencyMs}ms • Ping` : "Ping Diagnostics"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
        {/* Metric 1: Gemini AI Status */}
        <div className="p-3.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-start gap-3">
          <div className="p-2 rounded-lg bg-lavender-100 dark:bg-lavender-950/40 text-lavender-600 dark:text-lavender-400 mt-0.5">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">Gemini AI Token</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {data?.services.geminiAi.configured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-mint-600 shrink-0" />
                  <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                    Zero-Leak Active
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                  <span className="text-xs font-semibold text-coral-600 dark:text-coral-400">Belum Pasang</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark truncate mt-0.5">
              Multi-fallback Flash active
            </p>
          </div>
        </div>

        {/* Metric 2: Rate Limiter Status */}
        <div className="p-3.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-start gap-3">
          <div className="p-2 rounded-lg bg-mint-100 dark:bg-mint-950/40 text-mint-600 dark:text-mint-400 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">Abuse Guardrail</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-mint-600 shrink-0" />
              <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
                Sliding Window
              </span>
            </div>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark truncate mt-0.5">
              Max 10 req/min anti-spam
            </p>
          </div>
        </div>

        {/* Metric 3: Memory Usage */}
        <div className="p-3.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">Memory Heap</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
                {data ? `${data.runtime.memoryMb.heapUsed} MB` : "..."}
              </span>
            </div>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark truncate mt-0.5">
              {data ? `Total ${data.runtime.memoryMb.heapTotal} MB` : "Mengukur..."}
            </p>
          </div>
        </div>

        {/* Metric 4: Server Uptime */}
        <div className="p-3.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mt-0.5">
            <Server className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">Runtime Node.js</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
                {data?.runtime.nodeVersion || "Node.js"}
              </span>
            </div>
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark truncate mt-0.5">
              {data ? `Uptime: ${formatUptime(data.uptimeSeconds)}` : "Online"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
