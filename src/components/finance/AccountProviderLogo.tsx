"use client";

import React from "react";
import { AccountProvider } from "@/types/finance";
import { Wallet, Banknote, Building2, CreditCard } from "lucide-react";

interface AccountProviderLogoProps {
  provider: AccountProvider;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AccountProviderLogo({
  provider,
  className = "",
  size = "md",
}: AccountProviderLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  switch (provider) {
    case "gopay":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#00AED6] text-white flex items-center justify-center font-extrabold shadow-xs select-none ${className}`}
          title="GoPay"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-label="GoPay Logo">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          </svg>
        </div>
      );

    case "superbank":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#121212] text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center font-black tracking-tighter shadow-xs select-none ${className}`}
          title="Superbank"
        >
          <span className="font-mono text-xs font-black">S!</span>
        </div>
      );

    case "seabank":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#FF7A00] text-white flex items-center justify-center font-black shadow-xs select-none ${className}`}
          title="SeaBank"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-label="SeaBank Logo">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.8 14.5c-1.2 1-2.6 1.3-4.2 1-1.8-.3-3-1.6-3.1-3.4-.1-1.7 1-3.2 2.7-3.6l1.8-.4c.9-.2 1.3-.6 1.3-1.1 0-.6-.5-1-1.3-1-.8 0-1.5.3-2.1.8l-1-1.2c.9-.8 2-1.2 3.2-1.2 1.8 0 3 1.1 3 2.6 0 1.5-.9 2.5-2.4 2.8l-1.8.4c-.9.2-1.4.6-1.4 1.2 0 .7.6 1.2 1.5 1.2.9 0 1.8-.4 2.4-1l1 1.3z" />
          </svg>
        </div>
      );

    case "dana":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#118EEA] text-white flex items-center justify-center font-extrabold shadow-xs select-none ${className}`}
          title="DANA"
        >
          <span className="font-sans font-black text-[11px] tracking-tight">DANA</span>
        </div>
      );

    case "ovo":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#4C2A86] text-white flex items-center justify-center font-extrabold shadow-xs select-none ${className}`}
          title="OVO"
        >
          <span className="font-sans font-black text-[11px] tracking-wider text-[#7952B3]">OVO</span>
        </div>
      );

    case "shopeepay":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#EE4D2D] text-white flex items-center justify-center font-extrabold shadow-xs select-none ${className}`}
          title="ShopeePay"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-label="ShopeePay Logo">
            <path d="M19 6h-2c0-2.21-1.79-4-4-4S9 3.79 9 6H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm2.5 10.5c-.8.8-2 1-3.2.7-1.3-.3-2.1-1.2-2.2-2.5 0-1.3.8-2.3 2-2.6l1.3-.3c.7-.2 1-.4 1-.8 0-.4-.4-.7-1-.7-.6 0-1.1.2-1.5.6l-.8-.9c.6-.6 1.4-.9 2.3-.9 1.3 0 2.2.8 2.2 1.9 0 1.1-.7 1.8-1.8 2l-1.3.3c-.7.2-1 .4-1 .9 0 .5.4.9 1.1.9.7 0 1.3-.3 1.7-.7l.7.9z" />
          </svg>
        </div>
      );

    case "bca":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#005EAA] text-white flex items-center justify-center font-black tracking-tighter shadow-xs select-none ${className}`}
          title="Bank Central Asia (BCA)"
        >
          <span className="font-sans text-[11px] font-black">BCA</span>
        </div>
      );

    case "mandiri":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#003876] text-[#F9A825] flex items-center justify-center font-black tracking-tighter shadow-xs select-none ${className}`}
          title="Bank Mandiri"
        >
          <span className="font-sans text-[10px] font-black">mandiri</span>
        </div>
      );

    case "bri":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#00529C] text-[#F37024] flex items-center justify-center font-black tracking-tighter shadow-xs select-none ${className}`}
          title="Bank BRI"
        >
          <span className="font-sans text-[11px] font-black">BRI</span>
        </div>
      );

    case "bni":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#005E54] text-[#F15A24] flex items-center justify-center font-black tracking-tighter shadow-xs select-none ${className}`}
          title="Bank BNI"
        >
          <span className="font-sans text-[11px] font-black">BNI</span>
        </div>
      );

    case "cash":
      return (
        <div
          className={`${currentSize} rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-xs select-none ${className}`}
          title="Uang Tunai / Cash"
        >
          <Banknote className="w-4 h-4" />
        </div>
      );

    default:
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#7C5CFA] text-white flex items-center justify-center shadow-xs select-none ${className}`}
          title="Rekening Bank / Dompet"
        >
          <Wallet className="w-4 h-4" />
        </div>
      );
  }
}
