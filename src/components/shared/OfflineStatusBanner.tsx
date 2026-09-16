"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, CloudUpload, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] px-4 py-2 rounded-2xl bg-[#26232E]/95 text-white border border-white/10 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2.5 text-xs select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A85] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7A85]" />
            </span>
            <WifiOff className="w-4 h-4 text-[#FF7A85] shrink-0" />
            <span className="truncate text-[11px] font-medium text-white/90">
              <b>Mode Offline:</b> Perubahan disimpan lokal di HP/Laptop
            </span>
          </div>
          <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full shrink-0">
            Aman ✓
          </span>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] px-4 py-2 rounded-2xl bg-[#0F3E30]/95 text-white border border-[#7FE3C0]/30 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2.5 text-xs select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CloudUpload className="w-4 h-4 text-[#7FE3C0] shrink-0 animate-bounce" />
            <span className="truncate text-[11px] font-semibold text-[#E0FBF2]">
              Online kembali! Sinkronisasi cloud berhasil.
            </span>
          </div>
          <Check className="w-4 h-4 text-[#7FE3C0] shrink-0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
