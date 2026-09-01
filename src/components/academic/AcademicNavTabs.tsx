"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Calendar, BookOpen } from "lucide-react";
import { useDataStore } from "@/stores/use-data-store";
import { cn } from "@/lib/utils";

export function AcademicNavTabs() {
  const pathname = usePathname();
  const { tasks, courses } = useDataStore();

  const activeTasksCount = tasks.filter((t) => t.status !== "done").length;

  const tabs = [
    {
      label: "Daftar Tugas",
      href: "/academic",
      icon: CheckSquare,
      badge: activeTasksCount > 0 ? activeTasksCount : undefined,
    },
    {
      label: "Kalender Deadline",
      href: "/academic/calendar",
      icon: Calendar,
    },
    {
      label: "Mata Kuliah",
      href: "/academic/courses",
      icon: BookOpen,
      badge: courses.length > 0 ? courses.length : undefined,
    },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-1.5 p-1 bg-[#EDEAF2] dark:bg-[#2F2B3A] rounded-2xl w-full sm:w-fit min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all select-none whitespace-nowrap",
                isActive
                  ? "bg-[#7C5CFA] text-white shadow-soft"
                  : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-extrabold",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-[#7C5CFA]/15 text-[#7C5CFA]"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
