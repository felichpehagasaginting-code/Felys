import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { GoogleCalendarService } from "@/server/services/google-calendar.service";
import { UrgencyService } from "@/server/services/urgency.service";
import { stdSuccess, stdError } from "@/lib/validation";
import { Task } from "@/types/academic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) {
      return stdError("UNAUTHORIZED", "Kamu harus masuk akun terlebih dahulu.", 401);
    }

    const body = await req.json().catch(() => ({}));
    const { action, accessToken, calendarId, task, taskId, eventId } = body;

    if (!accessToken) {
      return stdError("BAD_REQUEST", "Access token Google Calendar diperlukan.", 400);
    }

    // 1. Inisialisasi kalender sekunder "Felys Academic"
    if (action === "init") {
      try {
        const calId = await GoogleCalendarService.getOrCreateFelysCalendar(accessToken);
        return stdSuccess({ calendarId: calId });
      } catch (err: any) {
        if (err.message?.includes("401")) {
          return stdError("UNAUTHORIZED_TOKEN", "Access token tidak valid atau telah kedaluwarsa.", 401);
        }
        throw err;
      }
    }

    if (!calendarId) {
      return stdError("BAD_REQUEST", "Calendar ID diperlukan.", 400);
    }

    const db = requireAdminDb();
    const tasksCol = db.collection("users").doc(uid).collection("tasks");

    // 2. Sinkronisasi Tunggal: Push Satu Task
    if (action === "push_single" && task) {
      if (task.googleCalendarEventId) {
        await GoogleCalendarService.updateEvent(accessToken, calendarId, task.googleCalendarEventId, task);
        return stdSuccess({ eventId: task.googleCalendarEventId });
      } else {
        const newEventId = await GoogleCalendarService.createEvent(accessToken, calendarId, task);
        await tasksCol.doc(task.id).update({
          googleCalendarEventId: newEventId,
          googleCalendarSyncedAt: new Date().toISOString(),
        });
        return stdSuccess({ eventId: newEventId });
      }
    }

    // 3. Sinkronisasi Tunggal: Delete Satu Event
    if (action === "delete_single" && eventId) {
      await GoogleCalendarService.deleteEvent(accessToken, calendarId, eventId);
      return stdSuccess({ message: "Event berhasil dihapus dari Google Calendar." });
    }

    // 4. Sinkronisasi Penuh Dua Arah (Full Bi-directional Sync)
    if (action === "sync") {
      let pulledCount = 0;
      let pushedCount = 0;

      // Ambil seluruh tugas aktif di Firestore
      const tasksSnap = await tasksCol.get();
      const tasksMap = new Map<string, Task>();
      const tasksByEventId = new Map<string, Task>();

      tasksSnap.docs.forEach((doc) => {
        const t = { id: doc.id, ...doc.data() } as Task;
        tasksMap.set(t.id, t);
        if (t.googleCalendarEventId) {
          tasksByEventId.set(t.googleCalendarEventId, t);
        }
      });

      // Tarik semua event dari kalender Google
      const gcalEvents = await GoogleCalendarService.pullEvents(accessToken, calendarId);
      const gcalEventIds = new Set(gcalEvents.map((e) => e.id));

      // PHASE 1: Pull perubahan dari Google Calendar ke Felys
      for (const event of gcalEvents) {
        // Cari tugas Felys yang cocok (via event ID atau property felysTaskId)
        const matchedTask =
          tasksByEventId.get(event.id) ||
          (event.felysTaskId ? tasksMap.get(event.felysTaskId) : undefined);

        if (matchedTask && event.end) {
          const gcalEndDate = new Date(event.end).toISOString();
          const felysDeadline = new Date(matchedTask.deadline).toISOString();

          // Jika deadline di Google Calendar berbeda dengan di Felys (misal user ubah di Google Calendar app)
          if (Math.abs(new Date(gcalEndDate).getTime() - new Date(felysDeadline).getTime()) > 60000) {
            const newScore = UrgencyService.calculateScore({
              deadline: gcalEndDate,
              priority: matchedTask.priority,
              estimatedHours: matchedTask.estimatedHours,
            });

            await tasksCol.doc(matchedTask.id).update({
              deadline: gcalEndDate,
              urgencyScore: newScore,
              googleCalendarEventId: event.id,
              googleCalendarSyncedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            pulledCount++;
          }
        }
      }

      // PHASE 2: Push tugas Felys ke Google Calendar
      for (const [taskId, t] of tasksMap.entries()) {
        // Jika tugas sudah selesai dan belum ada di GCal, skip
        if (t.status === "done" && !t.googleCalendarEventId) continue;

        try {
          if (t.googleCalendarEventId && gcalEventIds.has(t.googleCalendarEventId)) {
            // Update event yang sudah ada
            await GoogleCalendarService.updateEvent(accessToken, calendarId, t.googleCalendarEventId, t);
            pushedCount++;
          } else {
            // Buat event baru di Google Calendar
            const newEventId = await GoogleCalendarService.createEvent(accessToken, calendarId, t);
            await tasksCol.doc(taskId).update({
              googleCalendarEventId: newEventId,
              googleCalendarSyncedAt: new Date().toISOString(),
            });
            pushedCount++;
          }
        } catch (pushErr) {
          console.warn(`Gagal push task ${taskId} ke Google Calendar:`, pushErr);
        }
      }

      return stdSuccess({
        pulled: pulledCount,
        pushed: pushedCount,
        message: `Sinkronisasi selesai: ${pushedCount} tugas diunggah, ${pulledCount} jadwal diperbarui dari Google Calendar.`,
      });
    }

    return stdError("BAD_REQUEST", "Action tidak dikenali.", 400);
  } catch (err: any) {
    console.error("Calendar sync route error:", err);
    return stdError("INTERNAL_ERROR", err.message || "Gagal sinkronisasi kalender.", 500);
  }
}
