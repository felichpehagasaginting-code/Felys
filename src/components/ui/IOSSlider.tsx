"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/haptics";
import { playTick } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface IOSSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  formatValue?: (val: number) => string;
  label?: string;
  showTicks?: boolean;
}

export function IOSSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
  formatValue,
  label,
}: IOSSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTickVal = useRef(value);

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const rawPct = (clientX - rect.left) / rect.width;
      const clampedPct = Math.max(0, Math.min(1, rawPct));
      const rawVal = min + clampedPct * (max - min);

      // Quantize to step
      const steppedVal = Math.round(rawVal / step) * step;
      const finalVal = Math.max(min, Math.min(max, steppedVal));

      if (finalVal !== lastTickVal.current) {
        lastTickVal.current = finalVal;
        triggerHaptic("light");
        playTick();
        onChange(finalVal);
      }
    },
    [min, max, step, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextVal = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      nextVal = Math.min(max, value + step);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      nextVal = Math.max(min, value - step);
    } else {
      return;
    }

    e.preventDefault();
    if (nextVal !== value) {
      triggerHaptic("light");
      playTick();
      onChange(nextVal);
    }
  };

  return (
    <div className={cn("w-full space-y-1.5 select-none", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-muted px-0.5">
          <span>{label}</span>
          <span className="font-mono text-foreground font-bold">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}

      {/* Interactive Track Area */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative h-7 flex items-center cursor-pointer touch-none group outline-none"
      >
        {/* Outer Pill Track */}
        <div className="w-full h-3 rounded-full bg-[#E5E0D8] dark:bg-[#332F2B] overflow-hidden relative shadow-inner">
          {/* Active Accent Fill */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-accent via-accent to-accent-deep rounded-full"
            style={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        </div>

        {/* Floating Value Pill (appears when dragging) */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -28, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute pointer-events-none -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-foreground text-background text-[11px] font-mono font-bold shadow-lg z-20"
              style={{ left: `${percentage}%` }}
            >
              {formatValue ? formatValue(value) : value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apple-style Fluid Thumb */}
        <motion.div
          className="absolute -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#F5F3EE] shadow-md border border-black/10 flex items-center justify-center pointer-events-none"
          style={{ left: `${percentage}%` }}
          animate={{
            scale: isDragging ? 1.25 : 1,
            boxShadow: isDragging
              ? "0 8px 20px rgba(0,0,0,0.22)"
              : "0 2px 8px rgba(0,0,0,0.12)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {/* Subtle inner tactile dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-accent/70" />
        </motion.div>
      </div>
    </div>
  );
}
