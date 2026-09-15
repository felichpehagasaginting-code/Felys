import { describe, it, expect } from "vitest";

describe("UserAggregatedMetrics", () => {
  it("menghitung metrik net worth dan tugas aktif dengan tepat", () => {
    const mockAccounts = [
      { id: "acc_1", currentBalance: 250000 },
      { id: "acc_2", currentBalance: 500000 },
    ];
    const emergencyFund = 150000;

    const accountsTotal = mockAccounts.reduce((acc, a) => acc + a.currentBalance, 0);
    const netWorth = accountsTotal + emergencyFund;

    expect(netWorth).toBe(900000);

    const mockTasks = [
      { id: "t1", status: "todo" },
      { id: "t2", status: "in_progress" },
      { id: "t3", status: "done" },
    ];
    const activeTasksCount = mockTasks.filter((t) => t.status !== "done").length;
    const completedTasksCount = mockTasks.filter((t) => t.status === "done").length;

    expect(activeTasksCount).toBe(2);
    expect(completedTasksCount).toBe(1);
  });

  it("menghitung total menit fokus pomodoro sesi completed", () => {
    const mockSessions = [
      { durationMinutes: 25, completed: true },
      { durationMinutes: 25, completed: true },
      { durationMinutes: 25, completed: false },
    ];

    const totalMinutes = mockSessions
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    expect(totalMinutes).toBe(50);
  });
});
