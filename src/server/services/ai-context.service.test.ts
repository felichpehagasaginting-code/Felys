import { describe, it, expect } from "vitest";
import { AIContextService, UserAIContextPayload } from "./ai-context.service";

describe("AIContextService - Strict User Isolation & Context Generator", () => {
  it("returns default message when context is undefined", () => {
    const output = AIContextService.formatRealtimeContext(undefined);
    expect(output).toBe("Tidak ada data kontekstual yang tersedia.");
  });

  it("accurately formats full realtime context of a user", () => {
    const payload: UserAIContextPayload = {
      userProfile: {
        name: "Felich",
        email: "felichpehagasa@gmail.com",
      },
      ddayEvent: {
        title: "Sidang Skripsi",
        targetDate: "2026-10-15",
        daysLeft: 20,
      },
      courses: [
        {
          id: "c1",
          name: "Kecerdasan Buatan",
          sks: 3,
          todaySchedules: [
            {
              dayOfWeek: 4,
              startTime: "08:00",
              endTime: "10:30",
              room: "Lab 301",
            },
          ],
        },
      ],
      tasks: [
        {
          id: "t1",
          title: "Laporan AI Progress 2",
          course: "Kecerdasan Buatan",
          deadline: "2026-09-28",
          urgencyScore: 85,
          priority: "high",
          status: "in_progress",
          completedSubtasks: 2,
          totalSubtasks: 3,
        },
      ],
      accounts: [
        {
          name: "BCA Tabungan",
          provider: "bca",
          currentBalance: 1500000,
        },
        {
          name: "GoPay",
          provider: "gopay",
          currentBalance: 50000,
        },
      ],
      totalNetWorth: 1550000,
      budgetSummary: {
        totalLimit: 2000000,
        totalSpent: 800000,
        remaining: 1200000,
        percentage: 40,
        categories: [
          {
            name: "Makan & Minum",
            spent: 500000,
            limit: 1000000,
            usedPercentage: 50,
            status: "safe",
          },
        ],
      },
      savingsGoals: [
        {
          title: "Beli Laptop",
          currentAmount: 3000000,
          targetAmount: 10000000,
          percentage: 30,
        },
      ],
      debts: [
        {
          friendName: "Andi",
          amount: 50000,
          type: "they_owe_me",
          description: "Talangan makan siang",
        },
      ],
    };

    const output = AIContextService.formatRealtimeContext(payload);

    // Profile & D-Day
    expect(output).toContain("Felich");
    expect(output).toContain("Sidang Skripsi");
    expect(output).toContain("H-20");

    // Course & Schedule
    expect(output).toContain("Kecerdasan Buatan");
    expect(output).toContain("08:00-10:30");
    expect(output).toContain("Lab 301");

    // Tasks
    expect(output).toContain("Laporan AI Progress 2");
    expect(output).toContain("85/100");
    expect(output).toContain("HIGH");
    expect(output).toContain("Subtasks: 2/3");

    // Accounts & Net Worth
    expect(output).toContain("BCA Tabungan");
    expect(output).toContain("1.500.000");
    expect(output).toContain("Total Saldo Bersih (Net Worth): Rp 1.550.000");

    // Budgets
    expect(output).toContain("2.000.000");
    expect(output).toContain("800.000");
    expect(output).toContain("Makan & Minum");

    // Savings & Debts
    expect(output).toContain("Beli Laptop");
    expect(output).toContain("3.000.000");
    expect(output).toContain("Andi");
    expect(output).toContain("Talangan makan siang");
  });

  it("ensures strict isolation: Reza's session contains NO information about Felich", () => {
    const rezaPayload: UserAIContextPayload = {
      userProfile: {
        name: "Reza",
        email: "reza@gmail.com",
      },
      ddayEvent: {
        title: "UAS Semester 4",
        targetDate: "2026-11-01",
        daysLeft: 37,
      },
      courses: [
        {
          id: "c2",
          name: "Sistem Operasi",
          sks: 4,
        },
      ],
      accounts: [
        {
          name: "SeaBank",
          provider: "seabank",
          currentBalance: 250000,
        },
      ],
      totalNetWorth: 250000,
    };

    const rezaOutput = AIContextService.formatRealtimeContext(rezaPayload);

    // Verifies Reza's data is present
    expect(rezaOutput).toContain("Reza");
    expect(rezaOutput).toContain("UAS Semester 4");
    expect(rezaOutput).toContain("Sistem Operasi");
    expect(rezaOutput).toContain("SeaBank");

    // Strict multi-tenant isolation: Felich's data must NOT leak into Reza's prompt
    expect(rezaOutput).not.toContain("Felich");
    expect(rezaOutput).not.toContain("felichpehagasa@gmail.com");
    expect(rezaOutput).not.toContain("Sidang Skripsi");
    expect(rezaOutput).not.toContain("Kecerdasan Buatan");
    expect(rezaOutput).not.toContain("BCA Tabungan");
    expect(rezaOutput).not.toContain("1.550.000");
  });
});
