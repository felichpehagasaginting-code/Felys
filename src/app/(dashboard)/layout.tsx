"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { AIDrawer } from "@/components/ai/AIDrawer";
import { TaskFormModal } from "@/components/academic/TaskFormModal";
import { NumpadQuickEntry } from "@/components/finance/NumpadQuickEntry";
import { useModeStore } from "@/stores/use-mode-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useDataStore } from "@/stores/use-data-store";
import { Plus, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeMode } = useModeStore();
  const { user, isLoading } = useAuthStore();
  const { initFirestoreSync } = useDataStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  // Synchronize with real Firestore whenever user is logged in
  useEffect(() => {
    if (user) {
      const unsubscribe = initFirestoreSync(user.uid);
      return () => unsubscribe();
    }
  }, [user, initFirestoreSync]);

  const handleQuickAdd = () => {
    if (activeMode === "academic") {
      setIsTaskModalOpen(true);
    } else {
      setIsFinanceModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
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

      {/* Floating Action Button (FAB) on Mobile */}
      <button
        onClick={handleQuickAdd}
        className="lg:hidden fixed right-5 bottom-20 z-30 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-float hover:scale-105 active:scale-95 transition-all select-none"
        title={activeMode === "academic" ? "Tambah Tugas" : "Catat Transaksi"}
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global AI Chat Drawer */}
      <AIDrawer />

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
