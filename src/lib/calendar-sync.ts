import { Task } from "@/types/academic";

/**
 * Format Date to UTC iCalendar format: YYYYMMDDTHHMMSSZ
 */
function formatDateToICS(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Clean text for iCalendar fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate Google Calendar Web Intent URL for 1-Tap Add
 */
export function generateGoogleCalendarUrl(task: Task): string {
  const deadline = new Date(task.deadline);
  // Set start time 1 hour before deadline
  const startDate = new Date(deadline.getTime() - (task.estimatedHours || 2) * 60 * 60 * 1000);

  const title = encodeURIComponent(`[Felys] Deadline: ${task.title} (${task.courseName || "Kuliah"})`);
  const details = encodeURIComponent(
    `Tugas Kuliah dari Felys App.\n` +
      `Mata Kuliah: ${task.courseName || "-"}\n` +
      `Prioritas: ${task.priority.toUpperCase()}\n` +
      `Skor Urgensi: ${Math.round(task.urgencyScore)}/100\n` +
      (task.subtasks && task.subtasks.length > 0
        ? `Subtasks:\n${task.subtasks.map((s, i) => `${i + 1}. ${s.title} (${s.isDone ? "✓" : "○"})`).join("\n")}`
        : "")
  );

  const dates = `${formatDateToICS(startDate.toISOString())}/${formatDateToICS(deadline.toISOString())}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
}

/**
 * Generate standard RFC 5545 .ics calendar format
 */
export function generateICSContent(tasks: Task[], calendarName = "Jadwal Tugas Felys"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Felys//Student Academic Calendar//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    "X-WR-TIMEZONE:Asia/Jakarta",
  ];

  for (const task of tasks) {
    if (task.status === "done") continue;

    const deadline = new Date(task.deadline);
    const startDate = new Date(deadline.getTime() - (task.estimatedHours || 2) * 60 * 60 * 1000);
    const dtStamp = formatDateToICS(new Date().toISOString());
    const dtStart = formatDateToICS(startDate.toISOString());
    const dtEnd = formatDateToICS(deadline.toISOString());

    const description =
      `Mata Kuliah: ${task.courseName || "-"}\\n` +
      `Prioritas: ${task.priority.toUpperCase()}\\n` +
      `Skor Urgensi: ${Math.round(task.urgencyScore)}/100\\n` +
      (task.subtasks && task.subtasks.length > 0
        ? `Subtasks:\\n${task.subtasks.map((s, i) => `${i + 1}. ${s.title}`).join("\\n")}`
        : "");

    lines.push(
      "BEGIN:VEVENT",
      `UID:task_${task.id}@felys.app`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICSText(`[Felys] ${task.title} (${task.courseName || "Kuliah"})`)}`,
      `DESCRIPTION:${description}`,
      `CATEGORIES:ACADEMIC,STUDY`,
      "STATUS:CONFIRMED",
      // Reminder 1: 24 hours before
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Pengingat Deadline H-1: ${escapeICSText(task.title)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      // Reminder 2: 2 hours before
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Segera Kumpulkan: ${escapeICSText(task.title)}`,
      "TRIGGER:-PT2H",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Trigger download of .ics file in client browser
 */
export function downloadICSFile(tasks: Task[], filename = "felys_academic_calendar.ics") {
  const content = generateICSContent(tasks);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
