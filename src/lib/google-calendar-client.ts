"use client";

import { auth, googleProvider, db } from "@/lib/firebase/client";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Task } from "@/types/academic";

export interface GoogleCalendarIntegrationInfo {
  isConnected: boolean;
  connectedEmail?: string;
  calendarId?: string;
  lastSyncedAt?: string;
  accessToken?: string;
}

export class GoogleCalendarClient {
  /**
   * Request Google Calendar OAuth authorization via Google popup
   */
  public static async connect(userId: string): Promise<{ success: boolean; error?: string; calendarId?: string }> {
    try {
      // Create new provider instance to ensure calendar scope is added
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar.events");
      provider.setCustomParameters({ prompt: "consent" });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error("Gagal memperoleh access token dari Google Calendar.");
      }

      // Initialize or obtain the "Felys Academic" secondary calendar via backend API
      const initRes = await fetch("/api/academic/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", accessToken }),
      });

      const initJson = await initRes.json();
      if (!initJson.success) {
        throw new Error(initJson.error?.message || "Gagal menginisialisasi kalender Felys di Google Calendar.");
      }

      const calendarId = initJson.data?.calendarId;

      // Save integration info to Firestore
      const integrationRef = doc(db, "users", userId, "integrations", "google_calendar");
      await setDoc(integrationRef, {
        isConnected: true,
        calendarId,
        accessToken,
        connectedEmail: result.user.email || "",
        connectedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      });

      return { success: true, calendarId };
    } catch (err: any) {
      console.error("Google Calendar connection error:", err);
      return { success: false, error: err.message || "Gagal menghubungkan Google Calendar." };
    }
  }

  /**
   * Disconnect Google Calendar integration
   */
  public static async disconnect(userId: string): Promise<boolean> {
    try {
      const integrationRef = doc(db, "users", userId, "integrations", "google_calendar");
      await deleteDoc(integrationRef);
      return true;
    } catch (err) {
      console.error("Failed to disconnect Google Calendar:", err);
      return false;
    }
  }

  /**
   * Get current Google Calendar connection status
   */
  public static async getStatus(userId: string): Promise<GoogleCalendarIntegrationInfo | null> {
    try {
      const integrationRef = doc(db, "users", userId, "integrations", "google_calendar");
      const snap = await getDoc(integrationRef);
      if (!snap.exists()) return null;
      return snap.data() as GoogleCalendarIntegrationInfo;
    } catch (err) {
      console.warn("Error getting Google Calendar status:", err);
      return null;
    }
  }

  /**
   * Trigger bi-directional sync between Felys and Google Calendar
   */
  public static async syncNow(userId: string): Promise<{
    success: boolean;
    pushed?: number;
    pulled?: number;
    error?: string;
  }> {
    try {
      const status = await this.getStatus(userId);
      if (!status || !status.isConnected || !status.accessToken || !status.calendarId) {
        return { success: false, error: "Google Calendar belum terhubung." };
      }

      const res = await fetch("/api/academic/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          accessToken: status.accessToken,
          calendarId: status.calendarId,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        // If token expired (401), indicate reconnection needed
        if (json.error?.code === "UNAUTHORIZED_TOKEN") {
          return {
            success: false,
            error: "Sesi otorisasi Google telah kedaluwarsa. Silakan hubungkan ulang akun Google Calendar kamu.",
          };
        }
        throw new Error(json.error?.message || "Sinkronisasi gagal.");
      }

      // Update lastSyncedAt
      const integrationRef = doc(db, "users", userId, "integrations", "google_calendar");
      await setDoc(integrationRef, { lastSyncedAt: new Date().toISOString() }, { merge: true });

      return {
        success: true,
        pushed: json.data?.pushed || 0,
        pulled: json.data?.pulled || 0,
      };
    } catch (err: any) {
      console.error("Sync error:", err);
      return { success: false, error: err.message || "Gagal sinkronisasi dengan Google Calendar." };
    }
  }

  /**
   * Non-blocking background sync for a single task when created, modified, or deleted
   */
  public static async syncSingleTaskInBackground(
    userId: string,
    action: "push" | "delete",
    taskOrId: Task | { id: string; googleCalendarEventId?: string | null }
  ): Promise<void> {
    try {
      const status = await this.getStatus(userId);
      if (!status || !status.isConnected || !status.accessToken || !status.calendarId) return;

      if (action === "push") {
        await fetch("/api/academic/calendar-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "push_single",
            accessToken: status.accessToken,
            calendarId: status.calendarId,
            task: taskOrId,
          }),
        });
      } else if (action === "delete" && (taskOrId as any).googleCalendarEventId) {
        await fetch("/api/academic/calendar-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete_single",
            accessToken: status.accessToken,
            calendarId: status.calendarId,
            eventId: (taskOrId as any).googleCalendarEventId,
          }),
        });
      }
    } catch (err) {
      console.warn("Background Google Calendar task sync warning:", err);
    }
  }
}
