import { Task } from "@/types/academic";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
export const FELYS_CALENDAR_NAME = "Felys Academic";

export interface GoogleEventSummary {
  id: string;
  summary: string;
  start: string; // ISO string
  end: string;   // ISO string
  updated: string;
  felysTaskId?: string;
}

export class GoogleCalendarService {
  /**
   * Helper to make authenticated requests to Google Calendar API
   */
  private static async request(accessToken: string, path: string, options: RequestInit = {}) {
    const res = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Google Calendar API error (${res.status}): ${errorText || res.statusText}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  /**
   * Find or automatically create a dedicated "Felys Academic" secondary calendar
   * so the user's primary personal calendar remains organized.
   */
  public static async getOrCreateFelysCalendar(accessToken: string): Promise<string> {
    try {
      const listData = await this.request(accessToken, "/users/me/calendarList");
      const items: any[] = listData.items || [];

      const existing = items.find((c) => c.summary === FELYS_CALENDAR_NAME && !c.deleted);
      if (existing) {
        return existing.id;
      }

      // Create new secondary calendar
      const created = await this.request(accessToken, "/calendars", {
        method: "POST",
        body: JSON.stringify({
          summary: FELYS_CALENDAR_NAME,
          description: "Kalender tugas & deadline kuliah tersinkronisasi otomatis dari Felys App.",
          timeZone: "Asia/Jakarta",
        }),
      });

      return created.id;
    } catch (err: any) {
      console.error("Failed to get/create Felys Calendar:", err);
      throw err;
    }
  }

  /**
   * Convert Felys Task to Google Calendar Event payload
   */
  public static formatTaskToEvent(task: Task) {
    const deadline = new Date(task.deadline);
    const durationHours = Math.max(1, task.estimatedHours || 2);
    const startDate = new Date(deadline.getTime() - durationHours * 60 * 60 * 1000);

    const isDone = task.status === "done";
    const titlePrefix = isDone ? "[SELESAI] " : "";
    const summary = `${titlePrefix}[Felys] ${task.title} (${task.courseName || "Kuliah"})`;

    const subtasksText =
      task.subtasks && task.subtasks.length > 0
        ? `\n\nSubtasks:\n` + task.subtasks.map((s, i) => `${i + 1}. [${s.isDone ? "x" : " "}] ${s.title}`).join("\n")
        : "";

    const description =
      `Tugas Kuliah dari Felys App\n` +
      `Mata Kuliah: ${task.courseName || "-"}\n` +
      `Prioritas: ${task.priority.toUpperCase()}\n` +
      `Skor Urgensi: ${Math.round(task.urgencyScore)}/100\n` +
      (task.description ? `\nCatatan: ${task.description}` : "") +
      subtasksText;

    return {
      summary,
      description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Asia/Jakarta",
      },
      end: {
        dateTime: deadline.toISOString(),
        timeZone: "Asia/Jakarta",
      },
      colorId: task.priority === "high" ? "11" : task.priority === "medium" ? "5" : "2", // Red, Yellow, Green
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 24 * 60 }, // H-1 hari
          { method: "popup", minutes: 2 * 60 },  // H-2 jam
        ],
      },
      extendedProperties: {
        private: {
          felysTaskId: task.id,
        },
      },
    };
  }

  /**
   * Create an event in Google Calendar for a task
   */
  public static async createEvent(
    accessToken: string,
    calendarId: string,
    task: Task
  ): Promise<string> {
    const payload = this.formatTaskToEvent(task);
    const res = await this.request(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.id;
  }

  /**
   * Update an existing event in Google Calendar
   */
  public static async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    task: Task
  ): Promise<void> {
    const payload = this.formatTaskToEvent(task);
    await this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * Delete an event from Google Calendar
   */
  public static async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    try {
      await this.request(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
        }
      );
    } catch (err: any) {
      // If event already deleted (404/410), ignore
      if (!err.message?.includes("404") && !err.message?.includes("410")) {
        console.warn("Error deleting Google Calendar event:", err);
      }
    }
  }

  /**
   * Pull all events from Felys Calendar to detect user modifications in Google Calendar
   */
  public static async pullEvents(
    accessToken: string,
    calendarId: string
  ): Promise<GoogleEventSummary[]> {
    const data = await this.request(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&maxResults=250`
    );

    const items: any[] = data.items || [];
    return items
      .filter((item) => item.status !== "cancelled")
      .map((item) => ({
        id: item.id,
        summary: item.summary || "",
        start: item.start?.dateTime || item.start?.date || "",
        end: item.end?.dateTime || item.end?.date || "",
        updated: item.updated || "",
        felysTaskId: item.extendedProperties?.private?.felysTaskId,
      }));
  }
}
