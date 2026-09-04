"use client";

import React, { useEffect, useRef } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion/gsap-setup";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Jeda sebelum animasi mulai (detik), untuk efek stagger manual. */
  delay?: number;
  /** Jarak rise (px). */
  y?: number;
  /** Tambahkan blur-in (lebih unik, sedikit lebih berat — pakai seperlunya). */
  blur?: boolean;
}

/**
 * Reveal-on-scroll khas Felys: rise + fade + (opsional) blur-out,
 * sekali main (once) saat section masuk 88% viewport.
 */
export function Reveal({ children, className, delay = 0, y = 28, blur = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const { gsap } = ensureGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          y,
          opacity: 0,
          ...(blur ? { filter: "blur(8px)" } : {}),
        },
        {
          y: 0,
          opacity: 1,
          ...(blur ? { filter: "blur(0px)" } : {}),
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [y, delay, blur]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}
