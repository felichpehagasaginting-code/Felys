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
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold transition-all select-none active:scale-90",
                isActive
                  ? activeMode === "academic"
                    ? "text-[#7C5CFA]"
                    : "text-[#1F8766]"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-6",
                  isActive && "scale-110"
                )}
              />
              <span className="transition-transform group-hover:scale-105">{item.label}</span>
            </Link>
          );
        })}

        {/* Floating AI Button in Bottom Nav */}
        <button
          onClick={toggleDrawer}
          aria-label="Buka asisten Fio AI"
          className="group flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-semibold text-[#7C5CFA] transition-all active:scale-90 select-none"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7C5CFA] to-[#7FE3C0] flex items-center justify-center text-white shadow-soft transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="transition-transform group-hover:scale-105">Fio AI</span>
        </button>
      </div>
    </div>
  );
}
