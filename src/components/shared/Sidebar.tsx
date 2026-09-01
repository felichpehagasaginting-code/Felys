"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  BookOpen,
  Receipt,
  PieChart,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useAIStore } from "@/stores/use-ai-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { activeMode } = useModeStore();
  const { toggleDrawer } = useAIStore();

  const academicLinks = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Daftar Tugas", href: "/academic", icon: CheckSquare },
    { label: "Kalender", href: "/academic/calendar", icon: CalendarIcon },
    { label: "Mata Kuliah", href: "/academic/courses", icon: BookOpen },
  ];

  const financeLinks = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Transaksi", href: "/finance", icon: Receipt },
    { label: "Budget Bulanan", href: "/finance/budget", icon: PieChart },
    { label: "Laporan & Grafik", href: "/finance/reports", icon: BarChart3 },
  ];

  const currentLinks = activeMode === "academic" ? academicLinks : financeLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface/50 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Mode Tag */}
      <div className="px-3 py-2 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {activeMode === "academic" ? "Mode Akademik" : "Mode Keuangan"}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {currentLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none",
                isActive
                  ? activeMode === "academic"
                    ? "bg-[#EDE5FF] text-[#7C5CFA]"
                    : "bg-[#E0FBF2] text-[#1F8766]"
                  : "text-muted hover:text-foreground hover:bg-black/5"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive
                    ? activeMode === "academic"
                      ? "text-[#7C5CFA]"
                      : "text-[#1F8766]"
                    : "text-muted"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Banner Card in Sidebar */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EDE5FF]/80 to-[#E0FBF2]/80 dark:from-[#2E2838] dark:to-[#23352F] border border-[#B69CFF]/30 mt-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-[#7C5CFA] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground">Fio Assistant</span>
        </div>
        <p className="text-xs text-muted leading-relaxed mb-3">
          Tanya Fio seputar tugas kuliah & batas budget kamu kapan saja.
        </p>
        <button
          onClick={toggleDrawer}
          className="w-full py-2 px-3 rounded-xl bg-surface text-xs font-bold text-foreground shadow-soft hover:bg-white/90 transition-all text-center"
        >
          Buka Chat AI ✨
        </button>
      </div>
    </aside>
  );
}
