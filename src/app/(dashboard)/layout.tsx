"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { AIDrawer } from "@/components/ai/AIDrawer";
import { DynamicIsland } from "@/components/shared/DynamicIsland";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { TaskFormModal } from "@/components/academic/TaskFormModal";
import { NumpadQuickEntry } from "@/components/finance/NumpadQuickEntry";
import { useModeStore } from "@/stores/use-mode-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useDataStore } from "@/stores/use-data-store";
import { Plus, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PomodoroWidget } from "@/components/academic/PomodoroWidget";
import { ScratchpadPanel } from "@/components/shared/ScratchpadPanel";
import { OnboardingWizard } from "@/components/shared/OnboardingWizard";
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";
import { useAIStore } from "@/stores/use-ai-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeMode } = useModeStore();
  const { user, isLoading } = useAuthStore();
  const { initFirestoreSync } = useDataStore();
  const { toggleDrawer } = useAIStore();
  const { hasOnboarded, isLoaded: dataLoaded, courses, transactions } = useDataStore();

  // P3: wizard hanya untuk user login yang benar-benar baru
  // (belum onboard + belum punya data apa pun) — user lama tidak diganggu.
  const showOnboarding =
    !!user && !hasOnboarded && dataLoaded && courses.length === 0 && transactions.length === 0;

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  // P6-B: FAB sembunyi saat scroll ke bawah, muncul saat scroll ke atas
  const [isFabVisible, setIsFabVisible] = useState(true);

  // Synchronize with real Firestore handled globally by useAuthStore with automatic unsubscription on logout

  // P6-B: auto-hide FAB (pakai event Lenis bila ada, fallback scroll native)
  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;
    const onScrollPos = (y: number) => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const goingDown = y > lastY + 4;
          const goingUp = y < lastY - 4;
          if (goingDown && y > 140) setIsFabVisible(false);
          else if (goingUp || y <= 140) setIsFabVisible(true);
          lastY = y;
          ticking = false;
        });
      }
    };
    const lenis = (window as unknown as { __lenis?: {
      on: (e: string, cb: (ev: { scroll?: number }) => void) => void;
      off: (e: string, cb: (ev: { scroll?: number }) => void) => void;
    } }).__lenis;
    let detachLenis: (() => void) | null = null;
    if (lenis) {
      const cb = (e: { scroll?: number }) => onScrollPos(e.scroll ?? window.scrollY);
      lenis.on("scroll", cb);
      detachLenis = () => lenis.off("scroll", cb);
    }
    const native = () => onScrollPos(window.scrollY);
    window.addEventListener("scroll", native, { passive: true });
    return () => {
      window.removeEventListener("scroll", native);
      detachLenis?.();
    };
  }, []);

  const handleQuickAdd = () => {
    if (activeMode === "academic") {
      setIsTaskModalOpen(true);
    } else {
      setIsFinanceModalOpen(true);
    }
  };

  // P2: N = tambah cepat, F = asisten Fio (nonaktif saat mengetik/modal terbuka)
  useKeyboardShortcuts({ onQuickAdd: handleQuickAdd, onToggleFio: toggleDrawer });

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      <ScrollProgress />
      {/* Top Navbar */}
      <Navbar onOpenQuickAdd={handleQuickAdd} />

      {/* Auth Banner if not signed in */}
      {!isLoading && !user && (
        <div className="bg-gradient-to-r from-[#EDE5FF] to-[#E0FBF2] dark:from-[#2B2338] dark:to-[#1E2E28] border-b border-[#B69CFF]/30 px-4 py-2.5 text-xs text-foreground flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7C5CFA] shrink-0" />
            <span>
              Kamu sedang dalam mode pratinjau. <b>Masuk atau daftar</b> untuk menyimpan data tugas & keuangan kamu secara permanen di Cloud Firestore.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button size="sm" variant="academic" className="h-7 text-xs px-3">
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Floating Action Button (FAB) on Mobile — auto-hide saat scroll ke bawah */}
      <button
        onClick={handleQuickAdd}
        aria-label={activeMode === "academic" ? "Tambah tugas baru" : "Catat transaksi baru"}
        className={`lg:hidden fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-float hover:scale-105 active:scale-95 transition-all select-none ${
          isFabVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
        title={activeMode === "academic" ? "Tambah Tugas" : "Catat Transaksi"}
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Dynamic Island Apple Simulation */}
      <DynamicIsland />

      {/* Always-Open Companion Tools */}
      <PomodoroWidget />
      <ScratchpadPanel />

      {/* Global AI Chat Drawer */}
      <AIDrawer />

      {/* P3: Onboarding wizard untuk user baru */}
      {showOnboarding && <OnboardingWizard />}

      {/* Global Quick Add Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <NumpadQuickEntry
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
      />
    </div>
  );
}
