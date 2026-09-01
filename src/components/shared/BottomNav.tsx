"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Receipt,
  PieChart,
  Sparkles,
  Calendar,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useAIStore } from "@/stores/use-ai-store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { activeMode } = useModeStore();
  const { toggleDrawer } = useAIStore();

  const academicItems = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Tugas", href: "/academic", icon: CheckSquare },
    { label: "Kalender", href: "/academic/calendar", icon: Calendar },
    { label: "Matkul", href: "/academic/courses", icon: BookOpen },
  ];

  const financeItems = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Transaksi", href: "/finance", icon: Receipt },
    { label: "Budget", href: "/finance/budget", icon: PieChart },
    { label: "Laporan", href: "/finance/reports", icon: BarChart3 },
  ];

  const currentItems = activeMode === "academic" ? academicItems : financeItems;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] safe-bottom shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {currentItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold transition-colors",
                isActive
                  ? activeMode === "academic"
                    ? "text-[#7C5CFA]"
                    : "text-[#1F8766]"
                  : "text-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Floating AI Button in Bottom Nav */}
        <button
          onClick={toggleDrawer}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold text-[#7C5CFA]"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white shadow-soft">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Fio AI</span>
        </button>
      </div>
    </div>
  );
}
