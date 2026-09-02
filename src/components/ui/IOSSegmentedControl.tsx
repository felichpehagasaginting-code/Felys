"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/haptics";
import { playTick } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  activeColor?: string; // Optional custom background color for active pill
  activeTextColor?: string;
}

interface IOSSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  pillClassName?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function IOSSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  pillClassName,
  size = "md",
  disabled = false,
}: IOSSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const lastTickIndex = useRef<number>(-1);

  const selectedIndex = options.findIndex((opt) => opt.id === value);
  const activeIndex = isDragging && hoveredIndex !== null ? hoveredIndex : selectedIndex;

  const calculateIndexFromPointer = useCallback(
    (clientX: number): number => {
      if (!containerRef.current || options.length === 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const segmentWidth = rect.width / options.length;
      const rawIdx = Math.floor(relativeX / segmentWidth);
      return Math.max(0, Math.min(options.length - 1, rawIdx));
    },
    [options.length]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const idx = calculateIndexFromPointer(e.clientX);
    setHoveredIndex(idx);
    lastTickIndex.current = idx;
    triggerHaptic("light");
    playTick();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    const idx = calculateIndexFromPointer(e.clientX);

    if (idx !== lastTickIndex.current) {
      lastTickIndex.current = idx;
      setHoveredIndex(idx);
      triggerHaptic("light");
      playTick();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    const finalIdx = calculateIndexFromPointer(e.clientX);

    setIsDragging(false);
    setHoveredIndex(null);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    if (options[finalIdx] && options[finalIdx].id !== value) {
      triggerHaptic("medium");
      onChange(options[finalIdx].id);
    }
  };

  const currentOption = options[activeIndex >= 0 ? activeIndex : 0];

  const sizeClasses = {
    sm: "p-0.5 text-[11px] h-8",
    md: "p-1 text-xs h-10",
    lg: "p-1.5 text-sm h-12",
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "relative flex items-center bg-[#EDE8DF]/90 dark:bg-[#2B2724] rounded-full border border-border touch-none select-none cursor-pointer transition-shadow",
        isDragging && "ring-2 ring-accent/30 shadow-inner",
        sizeClasses[size],
        className
      )}
    >
      {/* Sliding Active Pill Indicator */}
      <motion.div
        layout
        className={cn(
          "absolute top-1 bottom-1 rounded-full shadow-sm z-0 pointer-events-none transition-colors",
          currentOption?.activeColor || "bg-accent",
          pillClassName
        )}
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: `calc(${(activeIndex * 100) / options.length}% + 2px)`,
        }}
        animate={{
          scale: isDragging ? 1.04 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 34,
          mass: 0.8,
        }}
      />

      {/* Segments */}
      {options.map((option, idx) => {
        const isSelected = activeIndex === idx;

        return (
          <div
            key={option.id}
            onClick={() => {
              if (disabled || option.id === value) return;
              triggerHaptic("light");
              playTick();
              onChange(option.id);
            }}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full px-2.5 rounded-full font-bold transition-all duration-200 text-center",
              isSelected
                ? option.activeTextColor || "text-white dark:text-[#181716]"
                : "text-muted hover:text-foreground"
            )}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </div>
        );
      })}
    </div>
  );
}
