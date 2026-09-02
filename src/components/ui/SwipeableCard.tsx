"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { playPop, playThud } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightColor?: string; // Tailwind class
  leftColor?: string; // Tailwind class
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Selesai",
  leftLabel = "Hapus",
  rightIcon = <Check className="w-5 h-5 text-white" />,
  leftIcon = <Trash2 className="w-5 h-5 text-white" />,
  rightColor = "bg-[#37B98F]",
  leftColor = "bg-[#FF7A85]",
  threshold = 85,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [hasTriggeredThreshold, setHasTriggeredThreshold] = useState(false);

  // Opacity transforms for background action layers
  const rightOpacity = useTransform(x, [15, threshold], [0, 1]);
  const leftOpacity = useTransform(x, [-threshold, -15], [1, 0]);

  // Scale transforms for action icons (elastic expansion as you drag further)
  const rightIconScale = useTransform(x, [20, threshold, threshold + 50], [0.6, 1, 1.25]);
  const leftIconScale = useTransform(x, [-threshold - 50, -threshold, -20], [1.25, 1, 0.6]);

  const handleDrag = (_: any, info: PanInfo) => {
    if (disabled) return;
    const currentX = info.offset.x;

    // Trigger subtle haptic tick once when crossing the threshold
    if (Math.abs(currentX) >= threshold && !hasTriggeredThreshold) {
      setHasTriggeredThreshold(true);
      triggerHaptic("medium");
    } else if (Math.abs(currentX) < threshold && hasTriggeredThreshold) {
      setHasTriggeredThreshold(false);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled) return;
    const currentX = info.offset.x;
    setHasTriggeredThreshold(false);

    if (currentX >= threshold && onSwipeRight) {
      triggerHaptic("success");
      playPop();
      onSwipeRight();
    } else if (currentX <= -threshold && onSwipeLeft) {
      triggerHaptic("warning");
      playThud();
      onSwipeLeft();
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-3xl touch-pan-y select-none", className)}>
      {/* Background Reveal Layer: Right Swipe (Green / Selesai) */}
      {onSwipeRight && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={cn(
            "absolute inset-0 flex items-center justify-start pl-6 rounded-3xl z-0 transition-colors",
            rightColor
          )}
        >
          <motion.div
            style={{ scale: rightIconScale }}
            className="flex items-center gap-2 text-white font-bold text-xs"
          >
            {rightIcon}
            <span>{rightLabel}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Background Reveal Layer: Left Swipe (Red / Hapus) */}
      {onSwipeLeft && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={cn(
            "absolute inset-0 flex items-center justify-end pr-6 rounded-3xl z-0 transition-colors",
            leftColor
          )}
        >
          <motion.div
            style={{ scale: leftIconScale }}
            className="flex items-center gap-2 text-white font-bold text-xs"
          >
            <span>{leftLabel}</span>
            {leftIcon}
          </motion.div>
        </motion.div>
      )}

      {/* Foreground Swipeable Card Body */}
      <motion.div
        drag={disabled ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: onSwipeLeft ? -130 : 0, right: onSwipeRight ? 130 : 0 }}
        dragElastic={{ left: 0.65, right: 0.65 }}
        dragSnapToOrigin
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
