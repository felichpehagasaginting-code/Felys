"use client";

import React, { useState } from "react";
import { AccountProvider } from "@/types/finance";
import { Wallet } from "lucide-react";

interface AccountProviderLogoProps {
  provider: AccountProvider;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const PROVIDER_INFO: Record<
  AccountProvider,
  { label: string; file: string; bg: string; needsPadding?: boolean }
> = {
  // Logo resmi tiap brand (PNG 512px, sumber: Wikimedia Commons / situs resmi brand).
  // Semua file transparan — tile putih agar sesuai brand guideline.
  gopay: { label: "GoPay", file: "gopay.png", bg: "#FFFFFF", needsPadding: true },
  superbank: { label: "Superbank", file: "superbank.png", bg: "#0E0E0E", needsPadding: true },
  seabank: { label: "SeaBank", file: "seabank.png", bg: "#FFFFFF", needsPadding: true },
  dana: { label: "DANA", file: "dana.png", bg: "#FFFFFF", needsPadding: true },
  ovo: { label: "OVO", file: "ovo.png", bg: "#FFFFFF", needsPadding: true },
  shopeepay: { label: "ShopeePay", file: "shopeepay.png", bg: "#FFFFFF", needsPadding: true },
  bca: { label: "BCA", file: "bca.png", bg: "#FFFFFF", needsPadding: true },
  mandiri: { label: "Mandiri", file: "mandiri.png", bg: "#FFFFFF", needsPadding: true },
  bri: { label: "BRI", file: "bri.png", bg: "#FFFFFF", needsPadding: true },
  bni: { label: "BNI", file: "bni.png", bg: "#FFFFFF", needsPadding: true },
  cash: { label: "Uang Tunai", file: "cash.svg", bg: "#10B981" },
  custom: { label: "Lainnya", file: "cash.svg", bg: "#7C5CFA" },
};

export function AccountProviderLogo({
  provider,
  className = "",
  size = "md",
}: AccountProviderLogoProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-6 h-6 rounded-lg",
    md: "w-9 h-9 rounded-2xl",
    lg: "w-11 h-11 rounded-2xl",
    xl: "w-14 h-14 rounded-3xl",
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const info = PROVIDER_INFO[provider] || PROVIDER_INFO.custom;

  if (provider === "custom" || hasError) {
    return (
      <div
        className={`${currentSizeClass} bg-[#7C5CFA] text-white flex items-center justify-center shadow-soft shrink-0 select-none ${className}`}
        title={info.label}
      >
        <Wallet className={size === "sm" ? "w-3 h-3" : size === "xl" ? "w-6 h-6" : "w-4 h-4"} />
      </div>
    );
  }

  return (
    <div
      className={`${currentSizeClass} overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center relative border border-black/5 dark:border-white/10 ${className}`}
      style={{ backgroundColor: info.bg }}
      title={info.label}
    >
      <img
        src={`/logos/${info.file}`}
        alt={`${info.label} logo resmi`}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain ${
          info.needsPadding ? "p-1.5" : "p-0"
        }`}
        loading="eager"
      />
    </div>
  );
}
