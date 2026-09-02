"use client";

import React from "react";
import { GraduationCap, Wallet } from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { triggerHaptic } from "@/lib/haptics";
import { playWhoosh } from "@/lib/sounds";
import { IOSSegmentedControl, SegmentOption } from "@/components/ui/IOSSegmentedControl";

export function ModeSwitcher() {
  const { activeMode, setActiveMode } = useModeStore();

  const handleSwitch = (mode: "academic" | "finance") => {
    if (activeMode !== mode) {
      triggerHaptic("medium");
      playWhoosh();
      setActiveMode(mode);
    }
  };

  const options: SegmentOption<"academic" | "finance">[] = [
    {
      id: "academic",
      label: "Akademik",
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      activeColor: "bg-[#7C5CFA]",
      activeTextColor: "text-white",
    },
    {
      id: "finance",
      label: "Finance",
      icon: <Wallet className="w-3.5 h-3.5" />,
      activeColor: "bg-[#7FE3C0]",
      activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
    },
  ];

  return (
    <IOSSegmentedControl<"academic" | "finance">
      options={options}
      value={activeMode}
      onChange={handleSwitch}
      size="sm"
      className="w-44 sm:w-48 shadow-xs"
    />
  );
}

