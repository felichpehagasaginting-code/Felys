"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Moon,
  Sun,
  Laptop,
  Layers,
  Sparkles,
  LogOut,
  LogIn,
  ShieldCheck,
  Bell,
  BellRing,
  Calendar as CalendarIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Send,
  ExternalLink,
} from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/Button";
import { triggerHaptic } from "@/lib/haptics";
import { PushNotificationClient } from "@/lib/push-notification-client";
import { GoogleCalendarClient, GoogleCalendarIntegrationInfo } from "@/lib/google-calendar-client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { activeMode, setActiveMode } = useModeStore();
  const { theme, setTheme } = useThemeStore();
  const { user, signOut, cachedDisplayName } = useAuthStore();

  // Push Notification States
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testPushLoading, setTestPushLoading] = useState(false);

  // Google Calendar States
  const [gcalStatus, setGcalStatus] = useState<GoogleCalendarIntegrationInfo | null>(null);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalSyncLoading, setGcalSyncLoading] = useState(false);

  // Load push status and calendar status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setIsPushSupported(PushNotificationClient.isSupported());
      if (PushNotificationClient.isSupported()) {
        const sub = await PushNotificationClient.getSubscription();
        setIsPushSubscribed(!!sub);
      }

      if (user?.uid) {
        const status = await GoogleCalendarClient.getStatus(user.uid);
        setGcalStatus(status);
      }
    };
    checkStatus();
  }, [user]);

  // Handle Push Toggle
  const handleTogglePush = async () => {
    if (!user) {
      toast.info("Silakan masuk akun terlebih dahulu untuk mengaktifkan notifikasi push.");
      return;
    }
    triggerHaptic("medium");
    setPushLoading(true);

    try {
      if (isPushSubscribed) {
        const ok = await PushNotificationClient.unsubscribe(user.uid);
        if (ok) {
          setIsPushSubscribed(false);
          toast.success("Notifikasi push berhasil dinonaktifkan.");
        } else {
          toast.error("Gagal menonaktifkan notifikasi.");
        }
      } else {
        const res = await PushNotificationClient.subscribe(user.uid);
        if (res.success) {
          setIsPushSubscribed(true);
          toast.success("Notifikasi push aktif! ✨", {
            description: "Kamu akan menerima pengingat deadline & batas anggaran bahkan saat tab ditutup.",
          });
        } else {
          toast.error(res.error || "Gagal mengaktifkan notifikasi.");
        }
      }
    } finally {
      setPushLoading(false);
    }
  };

  // Handle Send Test Push
  const handleTestPush = async () => {
    if (!user) return;
    triggerHaptic("light");
    setTestPushLoading(true);

    try {
      const res = await fetch("/api/notifications/test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Uji Coba Felys Push ✨",
          body: "Halo! Notifikasi latar belakang Felys berfungsi dengan sempurna di perangkat kamu.",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Notifikasi percobaan terkirim!", {
          description: "Cek panel notifikasi sistem operasi perangkat kamu.",
        });
      } else {
        toast.error(json.error?.message || "Gagal mengirim notifikasi percobaan.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim notifikasi.");
    } finally {
      setTestPushLoading(false);
    }
  };

  // Handle Connect / Disconnect Google Calendar
  const handleConnectGcal = async () => {
    if (!user) {
      toast.info("Silakan masuk akun terlebih dahulu.");
      return;
    }
    triggerHaptic("medium");
    setGcalLoading(true);

    try {
      if (gcalStatus?.isConnected) {
        const ok = await GoogleCalendarClient.disconnect(user.uid);
        if (ok) {
          setGcalStatus(null);
          toast.success("Integrasi Google Calendar diputuskan.");
        }
      } else {
        const res = await GoogleCalendarClient.connect(user.uid);
        if (res.success) {
          const updated = await GoogleCalendarClient.getStatus(user.uid);
          setGcalStatus(updated);
          toast.success("Google Calendar terhubung! 📅", {
            description: "Kalender 'Felys Academic' telah dibuat di akun Google kamu.",
          });
        } else {
          toast.error(res.error || "Gagal menghubungkan Google Calendar.");
        }
      }
    } finally {
      setGcalLoading(false);
    }
  };

  // Handle Manual Bi-directional Sync
  const handleSyncGcal = async () => {
    if (!user) return;
    triggerHaptic("light");
    setGcalSyncLoading(true);

    try {
      const res = await GoogleCalendarClient.syncNow(user.uid);
      if (res.success) {
        toast.success("Sinkronisasi Berhasil! ✨", {
          description: `${res.pushed || 0} tugas diunggah ke Google Calendar, ${res.pulled || 0} jadwal ditarik ke Felys.`,
        });
        const updated = await GoogleCalendarClient.getStatus(user.uid);
        setGcalStatus(updated);
      } else {
        toast.error(res.error || "Gagal sinkronisasi.");
      }
    } finally {
      setGcalSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5 group">
          <span>Pengaturan Akun & Aplikasi</span>
          <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-[#7C5CFA] transition-transform duration-700 ease-out group-hover:rotate-180" />
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Kelola preferensi akun Firebase, notifikasi push, sinkronisasi kalender, dan AI assistant.
        </p>
      </div>

      <div className="space-y-4">
        {/* Real Profile Card */}
        {user ? (
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white font-extrabold text-xl shadow-soft">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {user.displayName || cachedDisplayName || "Mahasiswa Felys"}
                </h3>
                <p className="text-xs text-muted">{user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0FBF2] text-[#1F8766] border border-[#9EE9D0] dark:bg-[#1E332A] dark:text-[#7FE3C0] dark:border-[#2E5244]">
                  <ShieldCheck className="w-3 h-3" /> Cloud Firestore Connected
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                triggerHaptic("medium");
                signOut();
              }}
              variant="secondary"
              size="sm"
              className="rounded-xl border-[#FF7A85]/40 text-[#D93D4A] hover:bg-[#FFE8EA] dark:hover:bg-[#382329] self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </Button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Belum Masuk Akun</h3>
              <p className="text-xs text-muted">
                Masuk atau daftar untuk menyinkronkan data tugas dan transaksi kamu secara real-time ke Cloud Firestore.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="academic" size="sm" className="rounded-xl">
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* PWA Background Web Push Notification Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPushSubscribed ? "bg-[#E0FBF2] text-[#1F8766] dark:bg-[#1E332A] dark:text-[#7FE3C0]" : "bg-black/5 dark:bg-white/5 text-muted"}`}>
                {isPushSubscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Background Web Push Notifications (PWA)</span>
                  {isPushSubscribed ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E0FBF2] text-[#1F8766] dark:bg-[#1E332A] dark:text-[#7FE3C0]">
                      Aktif 🔔
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted">
                      Nonaktif
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Menerima pengingat tugas H-1/H-3 dan alert budget otomatis bahkan saat browser ditutup.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {isPushSubscribed && (
                <Button
                  onClick={handleTestPush}
                  disabled={testPushLoading}
                  variant="secondary"
                  size="sm"
                  className="rounded-xl text-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${testPushLoading ? "animate-spin" : ""}`} />
                  <span>{testPushLoading ? "Mengirim..." : "Tes Notifikasi"}</span>
                </Button>
              )}

              <Button
                onClick={handleTogglePush}
                disabled={pushLoading || !isPushSupported}
                variant={isPushSubscribed ? "secondary" : "academic"}
                size="sm"
                className="rounded-xl text-xs"
              >
                {pushLoading
                  ? "Memproses..."
                  : isPushSubscribed
                  ? "Nonaktifkan"
                  : "Aktifkan di Perangkat Ini"}
              </Button>
            </div>
          </div>

          {!isPushSupported && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Peramban atau lingkungan saat ini tidak mendukung API Service Worker Push Notification.</span>
            </div>
          )}
        </div>

        {/* Bi-directional Google Calendar Integration Card */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${gcalStatus?.isConnected ? "bg-[#EDE5FF] text-[#7C5CFA] dark:bg-[#2F244A] dark:text-[#B69CFF]" : "bg-black/5 dark:bg-white/5 text-muted"}`}>
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Sinkronisasi Google Calendar (2-Way Sync)</span>
                  {gcalStatus?.isConnected ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDE5FF] text-[#7C5CFA] dark:bg-[#2F244A] dark:text-[#B69CFF]">
                      Terhubung 📅
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted">
                      Belum Terhubung
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {gcalStatus?.isConnected
                    ? `Terhubung ke kalender "Felys Academic" (${gcalStatus.connectedEmail || "Akun Google"}).`
                    : "Sinkronkan tugas kuliah ke Google Calendar di HP & Laptop secara otomatis."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {gcalStatus?.isConnected ? (
                <>
                  <Button
                    onClick={handleSyncGcal}
                    disabled={gcalSyncLoading}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gcalSyncLoading ? "animate-spin" : ""}`} />
                    <span>{gcalSyncLoading ? "Sinkronisasi..." : "Sinkron Sekarang"}</span>
                  </Button>
                  <Button
                    onClick={handleConnectGcal}
                    disabled={gcalLoading}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs border-[#FF7A85]/30 text-[#D93D4A]"
                  >
                    <span>Putuskan</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnectGcal}
                  disabled={gcalLoading}
                  variant="academic"
                  size="sm"
                  className="rounded-xl text-xs"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{gcalLoading ? "Menghubungkan..." : "Hubungkan Google Calendar"}</span>
                </Button>
              )}
            </div>
          </div>

          {gcalStatus?.isConnected && gcalStatus.lastSyncedAt && (
            <div className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1F8766]" />
              <span>
                Terakhir disinkronkan: {new Date(gcalStatus.lastSyncedAt).toLocaleString("id-ID")}
              </span>
            </div>
          )}
        </div>

        {/* Theme Preference (Per-Device Persistence) */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Tema Tampilan (Tersimpan di Perangkat Ini)</span>
            </h3>
            <span className="text-[10px] font-semibold text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
              {theme === "dark" ? "Mode Gelap 🌙" : theme === "light" ? "Mode Terang ☀️" : "Sistem Otomatis 💻"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                triggerHaptic("light");
                setTheme("light");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === "light"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground block">Mode Terang</span>
              </div>
              <span className="text-[11px] text-muted block">
                Tampilan bersih & kontras cerah
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setTheme("dark");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === "dark"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Moon className="w-4 h-4 text-[#B69CFF]" />
                <span className="text-xs font-bold text-foreground block">Mode Gelap</span>
              </div>
              <span className="text-[11px] text-muted block">
                Nyaman di mata saat malam & hemat baterai OLED
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setTheme("system");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === "system"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Laptop className="w-4 h-4 text-[#37B98F]" />
                <span className="text-xs font-bold text-foreground block">Ikuti Sistem</span>
              </div>
              <span className="text-[11px] text-muted block">
                Otomatis menyesuaikan mode OS HP/Laptop
              </span>
            </button>
          </div>
        </div>

        {/* Mode Preference (Last Open Persistence) */}
        <div className="p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span>Mode Default Saat Buka Aplikasi ("Last Open")</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveMode("academic");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeMode === "academic"
                  ? "bg-[#EDE5FF] dark:bg-[#383442] border-[#7C5CFA] ring-2 ring-[#7C5CFA] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="text-xs font-bold text-foreground block">Mode Akademik 🎓</span>
              <span className="text-[11px] text-muted block mt-0.5">
                Fokus manajemen tugas & deadline kuliah
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveMode("finance");
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeMode === "finance"
                  ? "bg-[#E0FBF2] dark:bg-[#213831] border-[#37B98F] ring-2 ring-[#7FE3C0] shadow-soft"
                  : "bg-surface border-border hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="text-xs font-bold text-foreground block">Mode Keuangan 💸</span>
              <span className="text-[11px] text-muted block mt-0.5">
                Fokus pencatatan uang saku, rekening & budget
              </span>
            </button>
          </div>
        </div>

        {/* AI Persona Info */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#EDE5FF]/60 to-[#E0FBF2]/60 dark:from-[#252033] dark:to-[#1B2924] border border-[#B69CFF]/30 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7C5CFA] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Fio Assistant Engine</h3>
              <span className="text-[11px] text-muted">Powered by Google Gemini (Live API Connected)</span>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed pt-1">
            Fio terus menganalisis beban tugas dan pengeluaran kamu secara cerdas tanpa menghakimi,
            agar kehidupan kuliah kamu tetap terkendali dan tenang.
          </p>
        </div>
      </div>
    </div>
  );
}
