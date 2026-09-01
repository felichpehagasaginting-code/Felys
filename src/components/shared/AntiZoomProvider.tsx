"use client";

import { useEffect } from "react";

/**
 * Universal Anti-Zoom provider:
 * Prevents pinch-to-zoom, double-tap-to-zoom, and wheel-zoom on iOS Safari (iPhone) and mobile browsers.
 */
export function AntiZoomProvider() {
  useEffect(() => {
    // 1. Prevent iOS gesture zoom (Pinch-to-zoom)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("gesturestart", handleGesture, { passive: false });
    document.addEventListener("gesturechange", handleGesture, { passive: false });
    document.addEventListener("gestureend", handleGesture, { passive: false });

    // 2. Prevent Double-Tap to Zoom on mobile
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // 3. Prevent Ctrl + Wheel zoom on desktop trackpads
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
      document.removeEventListener("gestureend", handleGesture);
      document.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
