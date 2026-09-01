"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Bell, Check, Sparkles } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture beforeinstallprompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed prompt previously in this session
      const dismissed = sessionStorage.getItem("felys_pwa_dismissed");
      if (!dismissed && !isStandaloneMode) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic("medium");
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        toast.success("Felys berhasil dipasang di layar utama! ✨");
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      toast.info(
        "Untuk memasang di iPhone: Tekan tombol 'Share' (ikon kotak panah ke atas) di Safari, lalu pilih 'Add to Home Screen' 📲",
        { duration: 6000 }
      );
    }
  };

  const handleDismiss = () => {
    triggerHaptic("light");
    setShowPrompt(false);
    sessionStorage.setItem("felys_pwa_dismissed", "true");
  };

  const handleRequestNotification = async () => {
    triggerHaptic("medium");
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notifikasi aktif! Felys akan mengingatkan deadline & jatah harian kamu 🔔");
        new Notification("Felys Assistant ✨", {
          body: "Notifikasi pengingat akademik & keuangan aktif!",
          icon: "/favicon.ico",
        });
      } else {
        toast.info("Izin notifikasi belum diberikan.");
      }
    } else {
      toast.info("Browser ini belum mendukung notifikasi push.");
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <aside aria-label="Instalasi Aplikasi" className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 rounded-3xl bg-white dark:bg-[#26232E] border border-border shadow-2xl space-y-3 ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white shadow-soft shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">
                Pasang Felys di HP Kamu 📲
              </h4>
              <p className="text-[11px] text-muted">
                Akses cepat offline & bebas lag langsung dari layar utama.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleRequestNotification}
            className="py-2 px-3 rounded-xl border border-border bg-[#FAF9FC] dark:bg-[#342F3E] text-foreground text-[11px] font-bold hover:bg-[#EDE5FF] dark:hover:bg-[#3D354B] transition-all flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-[#7C5CFA]" />
            <span>Aktifkan Notif</span>
          </button>

          <button
            onClick={handleInstallClick}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#7C5CFA] to-[#6842f5] text-white text-[11px] font-bold shadow-soft hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Sekarang</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
