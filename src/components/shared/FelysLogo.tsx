"use client";

import React from "react";

interface FelysLogoProps {
  className?: string;
  size?: number | string;
  variant?: "full" | "icon-only";
}

export function FelysLogo({ className = "w-9 h-9", size }: FelysLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-soft shrink-0 select-none border border-black/5 dark:border-white/10 bg-white flex items-center justify-center ${className}`}
      style={style}
      title="Felys Logo"
    >
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Soft Background */}
        <rect width="512" height="512" fill="#FFFFFF" />

        {/* Purple / Lavender Stem & Top Bar */}
        <path d="M148 104H360V166H210V408H148V104Z" fill="#5E4EF4" />

        {/* Mint Green Origami Fold Crossbar */}
        <path d="M148 288L210 226H336V288H148Z" fill="#6EE7B7" />
      </svg>
    </div>
  );
}
