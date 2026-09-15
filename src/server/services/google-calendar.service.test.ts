import { describe, it, expect } from "vitest";
import { GoogleCalendarService } from "./google-calendar.service";
import { Task } from "@/types/academic";

describe("GoogleCalendarService", () => {
  const mockTask: Task = {
    id: "task_123",
    title: "Makalah AI & Etika",
    courseId: "course_1",
    courseName: "Kecerdasan Buatan",
    courseColor: "#B69CFF",
    deadline: "2026-09-20T12:00:00.000Z",
    priority: "high",
    estimatedHours: 3,
    status: "todo",
    urgencyScore: 85,
    createdAt: "2026-09-15T10:00:00.000Z",
    updatedAt: "2026-09-15T10:00:00.000Z",
    subtasks: [
      { id: "sub_1", taskId: "task_123", title: "Cari Jurnal", isDone: true, order: 1 },
      { id: "sub_2", taskId: "task_123", title: "Tulis Bab 1", isDone: false, order: 2 },
    ],
  };

  it("memformat task aktif ke event Google Calendar dengan benar", () => {
    const event = GoogleCalendarService.formatTaskToEvent(mockTask);

    expect(event.summary).toBe("[Felys] Makalah AI & Etika (Kecerdasan Buatan)");
    expect(event.colorId).toBe("11"); // Red for high priority
    expect(event.end.dateTime).toBe("2026-09-20T12:00:00.000Z");
    expect(event.extendedProperties.private.felysTaskId).toBe("task_123");
    expect(event.description).toContain("Prioritas: HIGH");
    expect(event.description).toContain("Cari Jurnal");
    expect(event.reminders.overrides).toHaveLength(2);
  });

  it("menambahkan prefix [SELESAI] saat task berstatus done", () => {
    const doneTask: Task = { ...mockTask, status: "done" };
    const event = GoogleCalendarService.formatTaskToEvent(doneTask);

    expect(event.summary).toBe("[SELESAI] [Felys] Makalah AI & Etika (Kecerdasan Buatan)");
  });

  it("menyesuaikan warna event berdasarkan prioritas", () => {
    const mediumTask: Task = { ...mockTask, priority: "medium" };
    const lowTask: Task = { ...mockTask, priority: "low" };

    expect(GoogleCalendarService.formatTaskToEvent(mediumTask).colorId).toBe("5"); // Yellow
    expect(GoogleCalendarService.formatTaskToEvent(lowTask).colorId).toBe("2"); // Green
  });
});
