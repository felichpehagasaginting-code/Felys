"use client";

import React, { useEffect, useRef } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion/gsap-setup";

/**
 * Progress bar tipis di atas layar: gradient Lavender → Mint,
 * scaleX di-scrub mengikuti scroll halaman. Khas Felys dual-mode.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = ensureGsap();
    const tween = gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: 0,
          end: "max",
          scrub: 0.3,
        },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none">
      <div
        ref={ref}
        className="h-full w-full origin-left bg-gradient-to-r from-[#7C5CFA] via-[#B69CFF] to-[#7FE3C0]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
