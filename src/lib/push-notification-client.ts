"use client";

import { db } from "@/lib/firebase/client";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

/**
 * Utility to convert base64 string to Uint8Array for PushManager subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fallback public VAPID key for local development testing if not provided in env
export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BNwxSUE_kjn9uI8QMrutxs9w-1XW_oyy2448YHHuUlRMSnb9k_LdOT2S8xvCwHPze_6eDz10hV9KMR_rhvVTfFs";

export class PushNotificationClient {
  /**
   * Check if Push Notification & Service Worker are supported on this device/browser
   */
  public static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }

  /**
   * Register the root service worker
   */
  public static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.warn("Failed to register service worker:", err);
      return null;
    }
  }

  /**
   * Get current push subscription if exists
   */
  public static async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch (err) {
      console.warn("Error getting push subscription:", err);
      return null;
    }
  }

  /**
   * Subscribe current device to Web Push and store in Firestore
   */
  public static async subscribe(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: "Peramban kamu belum mendukung Web Push Notifications." };
    }

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return {
          success: false,
          error: "Izin notifikasi ditolak oleh pengguna. Silakan aktifkan izin notifikasi di browser.",
        };
      }

      // 2. Ensure Service Worker is registered
      const reg = await this.registerServiceWorker();
      if (!reg) {
        return { success: false, error: "Gagal menginisialisasi Service Worker." };
      }

      // 3. Subscribe with PushManager
      const applicationServerKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY) as unknown as BufferSource;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys) {
        throw new Error("Subscription data incomplete");
      }

      // 4. Save to Firestore under /users/{userId}/push_subscriptions/{id}
      const subId = btoa(subJson.endpoint.slice(-32)).replace(/[^a-zA-Z0-9]/g, "");
      const subRef = doc(db, "users", userId, "push_subscriptions", subId);

      await setDoc(subRef, {
        id: subId,
        endpoint: subJson.endpoint,
        expirationTime: subJson.expirationTime || null,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: any) {
      console.error("Failed to subscribe to Web Push:", err);
      return { success: false, error: err.message || "Gagal mengaktifkan push notifikasi." };
    }
  }

  /**
   * Unsubscribe current device from Web Push and remove from Firestore
   */
  public static async unsubscribe(userId: string): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        const subId = btoa(endpoint.slice(-32)).replace(/[^a-zA-Z0-9]/g, "");

        await subscription.unsubscribe();

        if (userId) {
          const subRef = doc(db, "users", userId, "push_subscriptions", subId);
          await deleteDoc(subRef).catch(() => {});
        }
      }

      return true;
    } catch (err) {
      console.error("Error unsubscribing from Web Push:", err);
      return false;
    }
  }
}
