"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Wallet } from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { cn } from "@/lib/utils";

export function ModeSwitcher() {
  const { activeMode, setActiveMode } = useModeStore();

  return (
    <div className="relative flex items-center bg-[#EDEAF2]/80 dark:bg-[#383442] p-1 rounded-full border border-border">
      {/* Option: Academic */}
      <button
        type="button"
        onClick={() => setActiveMode("academic")}
        className={cn(
          "relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 select-none",
          activeMode === "academic" ? "text-white" : "text-[#8A8593] hover:text-[#2D2A32]"
        )}
      >
        <GraduationCap className="w-4 h-4" />
        <span>Akademik</span>
      </button>

      {/* Option: Finance */}
      <button
        type="button"
        onClick={() => setActiveMode("finance")}
        className={cn(
          "relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 select-none",
          activeMode === "finance" ? "text-[#1F8766]" : "text-[#8A8593] hover:text-[#2D2A32]"
        )}
      >
        <Wallet className="w-4 h-4" />
        <span>Finance</span>
      </button>

      {/* Animated Sliding Pill */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className={cn(
          "absolute top-1 bottom-1 rounded-full shadow-sm",
          activeMode === "academic"
            ? "left-1 w-[calc(50%-4px)] bg-[#7C5CFA]"
            : "right-1 w-[calc(50%-4px)] bg-[#7FE3C0]"
        )}
      />
    </div>
  );
}
