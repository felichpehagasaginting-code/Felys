import { describe, it, expect } from "vitest";
import { cleanFirestoreData } from "./firestore-service";
import { Course } from "@/types/academic";

describe("Course CRUD & Data Integrity", () => {
  it("cleans and serializes Course data safely for Firestore without undefined fields", () => {
    const rawCourse: Partial<Course> = {
      id: "course_test_1",
      name: "Struktur Data & Algoritma",
      color: "#7C5CFA",
      sks: 4,
      schedules: [
        {
          id: "sch_1",
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "10:30",
          room: undefined, // Must be omitted by cleanFirestoreData
        },
      ],
    };

    const cleaned = cleanFirestoreData(rawCourse);

    expect(cleaned.name).toBe("Struktur Data & Algoritma");
    expect(cleaned.color).toBe("#7C5CFA");
    expect(cleaned.sks).toBe(4);
    expect(cleaned.schedules?.[0].room).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(cleaned.schedules?.[0], "room")).toBe(false);
  });

  it("validates course name length according to Firestore Security Rules", () => {
    const validName = "Pemrograman Berorientasi Objek";
    expect(validName.length >= 1 && validName.length <= 200).toBe(true);

    const emptyName = "";
    expect(emptyName.length >= 1 && emptyName.length <= 200).toBe(false);
  });

  it("properly serializes schedule updates into course object", () => {
    const initialCourse: Course = {
      id: "c-100",
      name: "Kecerdasan Buatan",
      color: "#B69CFF",
      sks: 3,
      schedules: [],
    };

    const newSchedule = {
      id: "sch_99",
      dayOfWeek: 2 as const,
      startTime: "13:00",
      endTime: "15:30",
      room: "Lab AI 2",
    };

    const updated = {
      ...initialCourse,
      schedules: [...(initialCourse.schedules || []), newSchedule],
      updatedAt: new Date().toISOString(),
    };

    const cleaned = cleanFirestoreData(updated);
    expect(cleaned.schedules).toHaveLength(1);
    expect(cleaned.schedules?.[0].room).toBe("Lab AI 2");
    expect(cleaned.schedules?.[0].dayOfWeek).toBe(2);
  });

  it("supports full 7-day schedules including Saturday (6) and Sunday (7)", () => {
    const weekendCourse: Course = {
      id: "c-weekend",
      name: "Studi Mandiri & Seminar",
      color: "#7FE3C0",
      sks: 2,
      schedules: [
        {
          id: "sch_sat",
          dayOfWeek: 6, // Sabtu
          startTime: "09:00",
          endTime: "11:30",
          room: "Auditorium",
        },
        {
          id: "sch_sun",
          dayOfWeek: 7, // Minggu
          startTime: "13:00",
          endTime: "15:00",
          room: undefined, // Room kosong
        },
      ],
    };

    const cleaned = cleanFirestoreData(weekendCourse);
    expect(cleaned.schedules).toHaveLength(2);
    expect(cleaned.schedules?.[0].dayOfWeek).toBe(6);
    expect(cleaned.schedules?.[0].room).toBe("Auditorium");
    expect(cleaned.schedules?.[1].dayOfWeek).toBe(7);
    expect(Object.prototype.hasOwnProperty.call(cleaned.schedules?.[1], "room")).toBe(false);
  });
});
