import { requireAdminDb } from "@/lib/firebase/auth-helpers";

export interface UserAggregatedMetrics {
  netWorth: number;
  activeTasksCount: number;
  completedTasksCount: number;
  totalTransactionsCount: number;
  totalSpentThisMonth: number;
  totalFocusMinutes: number;
  lastActiveAt: string;
}

export class UserMetricsService {
  /**
   * Recalculate full aggregated metrics for a user and save directly to /users/{userId}
   * This provides the project owner with a fast, instant overview of every student in Firebase Console.
   */
  public static async recalculateAndSync(userId: string): Promise<UserAggregatedMetrics | null> {
    try {
      const db = requireAdminDb();
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) return null;
      const userData = userDoc.data() || {};
      const emergencyFund = Number(userData.emergencyFund) || 0;

      // 1. Calculate Net Worth from Accounts
      const accountsSnap = await userRef.collection("accounts").get();
      let accountsTotal = 0;
      accountsSnap.docs.forEach((doc) => {
        const bal = Number(doc.data().currentBalance) || 0;
        accountsTotal += bal;
      });
      const netWorth = accountsTotal + emergencyFund;

      // 2. Count Active vs Completed Tasks
      const tasksSnap = await userRef.collection("tasks").get();
      let activeTasksCount = 0;
      let completedTasksCount = 0;
      tasksSnap.docs.forEach((doc) => {
        const status = doc.data().status;
        if (status === "done") {
          completedTasksCount++;
        } else {
          activeTasksCount++;
        }
      });

      // 3. Transactions metrics & Current Month Spending
      const transactionsSnap = await userRef.collection("transactions").get();
      const totalTransactionsCount = transactionsSnap.size;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let totalSpentThisMonth = 0;
      transactionsSnap.docs.forEach((doc) => {
        const tr = doc.data();
        if (tr.type === "expense" && tr.date) {
          const d = new Date(tr.date);
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            totalSpentThisMonth += Number(tr.amount) || 0;
          }
        }
      });

      // 4. Pomodoro Focus Minutes
      const pomodoroSnap = await userRef.collection("pomodoro_sessions").get();
      let totalFocusMinutes = 0;
      pomodoroSnap.docs.forEach((doc) => {
        const s = doc.data();
        if (s.completed !== false) {
          totalFocusMinutes += Number(s.durationMinutes) || 0;
        }
      });

      const metrics: UserAggregatedMetrics = {
        netWorth,
        activeTasksCount,
        completedTasksCount,
        totalTransactionsCount,
        totalSpentThisMonth,
        totalFocusMinutes,
        lastActiveAt: new Date().toISOString(),
      };

      // Save to root document /users/{userId}
      await userRef.set(
        {
          stats: metrics,
          lastActiveAt: metrics.lastActiveAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return metrics;
    } catch (err) {
      console.warn(`UserMetricsService recalculate error for user ${userId}:`, err);
      return null;
    }
  }
}
