"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion/gsap-setup";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Smooth scrolling global (Lenis) yang tersinkron dengan GSAP ScrollTrigger.
 * - Dismount aman (destroy + refresh).
 * - Hormati prefers-reduced-motion (Lenis + animasi dimatikan).
 * - Instance diekspos di window.__lenis untuk scrollTo programmatis.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { ScrollTrigger } = ensureGsap();

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}

/** Scroll programmatis via Lenis (fallback ke native bila Lenis mati). */
export function smoothScrollTo(target: number | string, offset = 0) {
  if (typeof window === "undefined") return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target as never, { offset, duration: 1.2 });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  }
}
