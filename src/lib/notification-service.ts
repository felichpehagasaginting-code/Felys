"use client";

/**
 * Battery-friendly Web Notification & Synthetic Audio Service
 * Uses native Web Audio API oscillators so no external mp3 assets are loaded or kept in memory.
 */

class NotificationService {
  private audioCtx: AudioContext | null = null;

  public async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }

  public isPermissionGranted(): boolean {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    return Notification.permission === "granted";
  }

  public sendNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      tag?: string;
    }
  ): void {
    if (!this.isPermissionGranted()) return;

    try {
      new Notification(title, {
        icon: options?.icon || "/apple-touch-icon.png",
        body: options?.body || "Felys Assistant",
        tag: options?.tag || "felys_alert",
      });
    } catch (err) {
      console.warn("Notification dispatch failed:", err);
    }
  }

  /**
   * Plays a crisp, gentle synthetic chime with zero battery/memory footprint.
   * Auto-closes AudioContext immediately after tone completes.
   */
  public playChime(type: "focus_done" | "break_done" | "alert" = "focus_done"): void {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === "focus_done") {
        // Melodic 3-tone gentle bell (C5 -> E5 -> G5)
        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0.001, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.65);
        });

        setTimeout(() => ctx.close(), 1200);
      } else {
        // Single gentle ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now); // A5

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.55);

        setTimeout(() => ctx.close(), 800);
      }
    } catch {
      // Audio autoplay blocked or unsupported
    }
  }
}

export const notificationService = new NotificationService();
