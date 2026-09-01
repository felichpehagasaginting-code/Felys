/**
 * Haptic Vibration Feedback for iOS/Android PWA
 */
export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function triggerHaptic(pattern: HapticPattern = "light") {
  if (typeof window === "undefined" || !("navigator" in window)) return;

  try {
    if (navigator.vibrate) {
      switch (pattern) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(25);
          break;
        case "heavy":
          navigator.vibrate(45);
          break;
        case "success":
          navigator.vibrate([15, 40, 15]);
          break;
        case "warning":
          navigator.vibrate([30, 50, 30]);
          break;
        case "error":
          navigator.vibrate([40, 40, 40, 40]);
          break;
        default:
          navigator.vibrate(15);
      }
    }
  } catch {
    // Graceful fallback for non-supported browsers
  }
}
