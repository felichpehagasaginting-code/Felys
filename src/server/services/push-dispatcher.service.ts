import webpush from "web-push";
import { requireAdminDb } from "@/lib/firebase/auth-helpers";

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BNwxSUE_kjn9uI8QMrutxs9w-1XW_oyy2448YHHuUlRMSnb9k_LdOT2S8xvCwHPze_6eDz10hV9KMR_rhvVTfFs";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "tpW2RTCoGL-dn_e3xGVxtxNIqZtlB9T_AThj6XDRlsU";

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:developer@felys.app";

// Configure Web Push VAPID credentials
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn("Error setting VAPID details:", err);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
}

export class PushDispatcherService {
  /**
   * Dispatch Web Push notification to all active devices registered to a specific user
   */
  public static async sendPushToUser(
    userId: string,
    payload: PushPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      const db = requireAdminDb();
      const subsSnap = await db
        .collection("users")
        .doc(userId)
        .collection("push_subscriptions")
        .get();

      if (subsSnap.empty) {
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      const notificationString = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        url: payload.url || "/",
        tag: payload.tag || "felys-notification",
        data: payload.data || {},
      });

      const promises = subsSnap.docs.map(async (docSnap) => {
        const subData = docSnap.data();
        if (!subData.endpoint || !subData.keys) return;

        const pushSubscription = {
          endpoint: subData.endpoint,
          keys: {
            p256dh: subData.keys.p256dh,
            auth: subData.keys.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationString);
          sent++;
        } catch (err: any) {
          failed++;
          console.warn(`Web push dispatch failed for sub ${docSnap.id}:`, err?.statusCode || err?.message);

          // If subscription is expired or unsubscribed (404/410), clean it up from Firestore
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await docSnap.ref.delete().catch(() => {});
          }
        }
      });

      await Promise.allSettled(promises);
      return { sent, failed };
    } catch (err) {
      console.error("Failed to send push to user:", err);
      return { sent: 0, failed: 0 };
    }
  }
}
