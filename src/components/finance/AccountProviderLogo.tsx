"use client";

import React from "react";
import { AccountProvider } from "@/types/finance";
import { Wallet } from "lucide-react";

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
    sm: "w-6 h-6",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  switch (provider) {
    case "gopay":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="GoPay"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="GoPay Official Logo">
            <rect width="200" height="200" rx="44" fill="#00AED6" />
            <path
              d="M100 40C66.86 40 40 66.86 40 100c0 33.14 26.86 60 60 60 33.14 0 60-26.86 60-60 0-33.14-26.86-60-60-60zm0 94c-18.78 0-34-15.22-34-34s15.22-34 34-34 34 15.22 34 34-15.22 34-34 34z"
              fill="#FFFFFF"
            />
            <circle cx="100" cy="100" r="18" fill="#00AED6" />
          </svg>
        </div>
      );

    case "superbank":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="Superbank"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="Superbank Official Logo">
            <rect width="200" height="200" rx="44" fill="#111111" />
            {/* Authentic Superbank vibrant lightning S */}
            <path
              d="M142 54h-48c-18 0-30 11-30 27 0 14 8 22 24 27l28 8c12 3 17 8 17 15 0 9-8 16-22 16-16 0-29-7-39-17l-16 20c14 15 33 24 55 24 28 0 48-16 48-40 0-16-9-26-26-31l-27-8c-11-3-15-7-15-13 0-7 6-13 17-13h36l-19-15z"
              fill="#D2F800"
            />
            <circle cx="156" cy="146" r="10" fill="#D2F800" />
          </svg>
        </div>
      );

    case "seabank":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="SeaBank"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="SeaBank Official Logo">
            <defs>
              <linearGradient id="seabankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="100%" stopColor="#FF4500" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" rx="44" fill="url(#seabankGrad)" />
            {/* Authentic SeaBank S Wave */}
            <path
              d="M62 144c11 9 26 14 41 14 28 0 50-16 50-41 0-42-61-33-61-55 0-8 8-14 21-14 12 0 24 5 33 12l10-17c-12-9-27-14-43-14-26 0-46 16-46 39 0 41 61 32 61 55 0 9-8 16-23 16-16 0-29-6-39-16l-6 21z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case "dana":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="DANA"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="DANA Official Logo">
            <rect width="200" height="200" rx="44" fill="#118EEA" />
            {/* Authentic DANA Wordmark */}
            <path
              d="M36 68h28c20 0 34 13 34 32s-14 32-34 32H36V68zm20 48h8c9 0 14-6 14-16s-5-16-14-16h-8v32z"
              fill="#FFFFFF"
            />
            <path
              d="M98 132l20-64h16l20 64h-18l-3-13h-14l-3 13H98zm22-27h9l-4-19-5 19z"
              fill="#FFFFFF"
            />
            <path
              d="M152 68h18v40l20-40h18v64h-18V92l-20 40h-18V68z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case "ovo":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="OVO"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="OVO Official Logo">
            <rect width="200" height="200" rx="44" fill="#4C2A86" />
            {/* Authentic OVO Triple Mark */}
            <ellipse cx="60" cy="100" rx="22" ry="32" fill="none" stroke="#FFFFFF" strokeWidth="12" />
            <path d="M88 72l14 44 14-44h13l-20 56h-14l-20-56h13z" fill="#FFFFFF" />
            <ellipse cx="140" cy="100" rx="22" ry="32" fill="none" stroke="#FFFFFF" strokeWidth="12" />
          </svg>
        </div>
      );

    case "shopeepay":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="ShopeePay"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="ShopeePay Official Logo">
            <rect width="200" height="200" rx="44" fill="#EE4D2D" />
            {/* Official Shopee Shopping Bag with S */}
            <path
              d="M142 72h-14c-1-18-12-32-28-32s-27 14-28 32H58c-6 0-11 5-11 11l8 76c1 6 6 11 12 11h66c6 0 11-5 12-11l8-76c0-6-5-11-11-11zm-42-20c9 0 16 9 17 20H83c1-11 8-20 17-20zm14 74c-2 11-10 16-22 16-11 0-19-5-22-13l10-6c2 5 6 8 12 8s10-3 10-8c0-5-4-7-12-9-13-3-19-8-19-17 0-9 8-16 19-16 9 0 16 4 19 11l-10 6c-2-4-5-6-9-6s-9 3-9 7c0 4 3 6 11 8 14 3 22 7 22 19z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case "bca":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="Bank Central Asia (BCA)"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="BCA Official Logo">
            <rect width="200" height="200" rx="44" fill="#005EAA" />
            {/* BCA Official Diamond Crest */}
            <path d="M100 32l52 38v60l-52 38-52-38V70l52-38z" fill="#FFFFFF" />
            <path d="M100 50l36 26v48l-36 26-36-26V76l36-26z" fill="#005EAA" />
            <path
              d="M78 84h18c7 0 12 4 12 10s-5 10-12 10H78V84zm9 14h7c3 0 5-1 5-4s-2-4-5-4h-7v8zm27-14h16c8 0 13 4 13 9 0 4-3 7-7 8 5 1 8 5 8 9 0 6-5 10-14 10h-16V84zm9 12h6c3 0 5-1 5-3s-2-3-5-3h-6v6zm0 11h7c3 0 5-1 5-4s-2-4-5-4h-7v8z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );

    case "mandiri":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="Bank Mandiri"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="Bank Mandiri Official Logo">
            <rect width="200" height="200" rx="44" fill="#003876" />
            {/* Mandiri Golden Ribbon Wave */}
            <path
              d="M34 132c26-20 60-28 94-17 19 6 38 6 52-2v20c-16 10-36 10-56 3-32-11-64-2-90 15v-19z"
              fill="#F9A825"
            />
            <text
              x="100"
              y="92"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="34"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
              letterSpacing="-1.5"
            >
              mandiri
            </text>
          </svg>
        </div>
      );

    case "bri":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="Bank BRI"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="Bank BRI Official Logo">
            <rect width="200" height="200" rx="44" fill="#00529C" />
            {/* BRI Orange Arc */}
            <path
              d="M138 46c15 13 24 30 24 50 0 17-7 32-18 45l-15-13c8-10 14-20 14-32 0-14-6-26-17-34l12-16z"
              fill="#F37024"
            />
            <text
              x="84"
              y="122"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="60"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
              letterSpacing="-3"
            >
              BRI
            </text>
          </svg>
        </div>
      );

    case "bni":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="Bank BNI"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="Bank BNI Official Logo">
            <rect width="200" height="200" rx="44" fill="#005E54" />
            <rect x="120" y="42" width="48" height="48" rx="14" fill="#F15A24" />
            <text
              x="144"
              y="77"
              fontFamily="system-ui, sans-serif"
              fontSize="26"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              46
            </text>
            <text
              x="72"
              y="128"
              fontFamily="system-ui, sans-serif"
              fontSize="56"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
              letterSpacing="-2.5"
            >
              BNI
            </text>
          </svg>
        </div>
      );

    case "cash":
      return (
        <div
          className={`${currentSize} rounded-2xl overflow-hidden shadow-soft shrink-0 select-none flex items-center justify-center ${className}`}
          title="Uang Tunai / Cash"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="Uang Tunai Logo">
            <defs>
              <linearGradient id="cashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" rx="44" fill="url(#cashGrad)" />
            <rect x="34" y="54" width="132" height="92" rx="20" fill="none" stroke="#FFFFFF" strokeWidth="12" />
            <circle cx="100" cy="100" r="26" fill="none" stroke="#FFFFFF" strokeWidth="10" />
            <text
              x="100"
              y="110"
              fontFamily="system-ui, sans-serif"
              fontSize="24"
              fontWeight="900"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              Rp
            </text>
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`${currentSize} rounded-2xl bg-[#7C5CFA] text-white flex items-center justify-center shadow-soft shrink-0 select-none ${className}`}
          title="Rekening Bank / Dompet"
        >
          <Wallet className="w-5 h-5" />
        </div>
      );
  }
}
