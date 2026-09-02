"use client";

import { create } from "zustand";
import { Course, Task, SubTask, PriorityLevel, TaskStatus, DDayEvent } from "@/types/academic";
import {
  Category,
  Transaction,
  MonthlyBudgetSummary,
  Budget,
  RecurringBill,
  FriendDebt,
  DailyAllowanceSummary,
  SavingsGoal,
  FinancialAccount,
  AccountProvider,
} from "@/types/finance";
import { AIInsight } from "@/types/ai";
import { UrgencyService } from "@/server/services/urgency.service";
import { BudgetService } from "@/server/services/budget.service";
import { InsightService } from "@/server/services/insight.service";
import { FirestoreService, ALL_DEFAULT_CATEGORIES } from "@/lib/firebase/firestore-service";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "./use-auth-store";

function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || useAuthStore.getState().user?.uid || null;
}

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key: string, data: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

interface DataState {
  // Real Firestore Data
  courses: Course[];
  tasks: Task[];
  ddayEvent: DDayEvent;
  accounts: FinancialAccount[];
  categories: Category[];
  transactions: Transaction[];
  budgetLimits: { categoryId: string; monthlyLimit: number }[];
  recurringBills: RecurringBill[];
  debts: FriendDebt[];
  savingsGoals: SavingsGoal[];
  emergencyFund: number;
  insights: AIInsight[];
  isLoaded: boolean;

  // Real-time Firestore sync & cleanup
  initFirestoreSync: (userId: string) => () => void;
  resetDataStore: () => void;

  // Academic Actions
  addCourse: (course: Omit<Course, "id">) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  addTask: (task: Omit<Task, "id" | "urgencyScore" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;

  updateDDayEvent: (dday: { title: string; targetDate: string }) => Promise<void>;

  // Multi-Account & Wallet Actions
  addAccount: (account: Omit<FinancialAccount, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => Promise<void>;
  adjustAccountBalance: (id: string, newBalance: number) => Promise<void>;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, note?: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getTotalNetWorth: () => number;

  // Finance Actions
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setBudgetLimit: (categoryId: string, monthlyLimit: number) => Promise<void>;
  deleteBudgetLimit: (categoryId: string) => Promise<void>;
  getMonthlyBudgetSummary: (month?: number, year?: number) => MonthlyBudgetSummary;
  getDailyAllowanceSummary: () => DailyAllowanceSummary;
  addRecurringBill: (bill: Omit<RecurringBill, "id" | "createdAt">) => Promise<void>;
  deleteRecurringBill: (id: string) => Promise<void>;
  payRecurringBill: (id: string) => Promise<void>;

  // Split Bill & Debts Actions
  addDebt: (debt: Omit<FriendDebt, "id" | "createdAt" | "isSettled">) => Promise<void>;
  settleDebt: (id: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  // Savings Goals & Emergency Fund Actions
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "currentAmount" | "isCompleted" | "createdAt">) => Promise<void>;
  depositToSavingsGoal: (id: string, amount: number) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  depositEmergencyFund: (amount: number, note?: string) => Promise<void>;
  withdrawEmergencyFund: (amount: number, note?: string) => Promise<void>;
  rolloverSurplus: (amount: number) => Promise<void>;

  // AI Actions
  dismissInsight: (id: string) => void;
  refreshInsights: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  courses: loadLocal<Course[]>("felys_courses", []),
  tasks: loadLocal<Task[]>("felys_tasks", []),
  ddayEvent: loadLocal<DDayEvent>("felys_dday", {
    title: "Target Ujian / Sidang",
    targetDate: "",
  }),
  accounts: loadLocal<FinancialAccount[]>("felys_accounts", []),
  categories: loadLocal<Category[]>("felys_categories", []),
  transactions: loadLocal<Transaction[]>("felys_transactions", []),
  budgetLimits: loadLocal<{ categoryId: string; monthlyLimit: number }[]>("felys_budgets", []),
  recurringBills: loadLocal<RecurringBill[]>("felys_bills", []),
  debts: loadLocal<FriendDebt[]>("felys_debts", []),
  savingsGoals: loadLocal<SavingsGoal[]>("felys_savings", []),
  emergencyFund: loadLocal<number>("felys_emergency_fund", 0),
  insights: [],
  isLoaded: false,

  resetDataStore: () => {
    set({
      courses: [],
      tasks: [],
      categories: [],
      transactions: [],
      budgetLimits: [],
      debts: [],
      savingsGoals: [],
      emergencyFund: 0,
      insights: [],
      isLoaded: false,
    });
  },

  // Real-time Firestore synchronizer
  initFirestoreSync: (userId: string) => {
    // 1. Ensure categories are seeded in Firestore if brand new user
    FirestoreService.seedDefaultCategoriesIfEmpty(userId);

    // 2. Subscribe to user profile (D-Day event, emergency fund)
    const unsubProfile = FirestoreService.subscribeUserProfile(userId, (data) => {
      if (data.ddayEvent) {
        set({ ddayEvent: data.ddayEvent });
        saveLocal("felys_dday", data.ddayEvent);
        if (typeof window !== "undefined") {
          localStorage.setItem("felys_dday_title", data.ddayEvent.title);
          localStorage.setItem("felys_dday_date", data.ddayEvent.targetDate);
        }
      }
      if (typeof data.emergencyFund === "number") {
        set({ emergencyFund: data.emergencyFund });
        saveLocal("felys_emergency_fund", data.emergencyFund);
      }
    });

    // 3. Subscribe to real-time collections
    const unsubCourses = FirestoreService.subscribeCourses(userId, (courses) => {
      set({ courses });
      saveLocal("felys_courses", courses);
      get().refreshInsights();
    });

    const unsubTasks = FirestoreService.subscribeTasks(userId, (tasks) => {
      set({ tasks });
      saveLocal("felys_tasks", tasks);
      get().refreshInsights();
    });

    const unsubAccounts = FirestoreService.subscribeAccounts(userId, (accounts) => {
      set({ accounts });
      saveLocal("felys_accounts", accounts);
    });

    const unsubCategories = FirestoreService.subscribeCategories(userId, (categories) => {
      set({ categories });
      saveLocal("felys_categories", categories);
      get().refreshInsights();
    });

    const unsubTransactions = FirestoreService.subscribeTransactions(userId, (transactions) => {
      set({ transactions });
      saveLocal("felys_transactions", transactions);
      get().refreshInsights();
    });

    const unsubBudgets = FirestoreService.subscribeBudgets(userId, (budgetLimits) => {
      set({ budgetLimits, isLoaded: true });
      saveLocal("felys_budgets", budgetLimits);
      get().refreshInsights();
    });

    const unsubSavings = FirestoreService.subscribeSavingsGoals(userId, (savingsGoals) => {
      set({ savingsGoals });
      saveLocal("felys_savings", savingsGoals);
    });

    const unsubBills = FirestoreService.subscribeRecurringBills(userId, (recurringBills) => {
      set({ recurringBills });
      saveLocal("felys_bills", recurringBills);
    });

    const unsubDebts = FirestoreService.subscribeDebts(userId, (debts) => {
      set({ debts });
      saveLocal("felys_debts", debts);
    });

    return () => {
      unsubProfile();
      unsubCourses();
      unsubTasks();
      unsubAccounts();
      unsubCategories();
      unsubTransactions();
      unsubBudgets();
      unsubSavings();
      unsubBills();
      unsubDebts();
    };
  },

  // Academic Actions
  addCourse: async (courseData) => {
    const userId = getCurrentUserId();
    const courseId = `course_${Date.now()}`;
    const newCourse: Course = {
      ...courseData,
      id: courseId,
      createdAt: new Date().toISOString(),
    };

    const nextCourses = [...get().courses, newCourse];
    set({ courses: nextCourses });
    saveLocal("felys_courses", nextCourses);

    if (userId) {
      try {
        await FirestoreService.addCourse(userId, courseData, courseId);
      } catch (err: any) {
        console.warn("Firestore addCourse sync warning:", err?.message || err);
      }
    }
  },

  updateCourse: async (id, updates) => {
    const userId = getCurrentUserId();
    const nextCourses = get().courses.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ courses: nextCourses });
    saveLocal("felys_courses", nextCourses);

    if (userId) {
      try {
        await FirestoreService.updateCourse(userId, id, updates);
      } catch (err: any) {
        console.warn("Firestore updateCourse sync warning:", err?.message || err);
      }
    }
  },

  deleteCourse: async (id) => {
    const userId = getCurrentUserId();
    const nextCourses = get().courses.filter((c) => c.id !== id);
    const nextTasks = get().tasks.filter((t) => t.courseId !== id);
    set({
      courses: nextCourses,
      tasks: nextTasks,
    });
    saveLocal("felys_courses", nextCourses);
    saveLocal("felys_tasks", nextTasks);

    if (userId) {
      try {
        await FirestoreService.deleteCourse(userId, id);
      } catch (err: any) {
        console.warn("Firestore deleteCourse sync warning:", err?.message || err);
      }
    }
  },

  addTask: async (taskData) => {
    const userId = getCurrentUserId();
    const course = get().courses.find((c) => c.id === taskData.courseId);
    const urgencyScore = UrgencyService.calculateScore({
      deadline: taskData.deadline,
      priority: taskData.priority,
      estimatedHours: taskData.estimatedHours,
    });

    const taskId = `task_${Date.now()}`;
    const newTask: Task = {
      ...taskData,
      id: taskId,
      courseName: course?.name,
      courseColor: course?.color,
      urgencyScore,
      completedSubtasksCount: 0,
      totalSubtasksCount: taskData.subtasks?.length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextTasks = [...get().tasks, newTask].sort((a, b) => b.urgencyScore - a.urgencyScore);
    set({ tasks: nextTasks });
    saveLocal("felys_tasks", nextTasks);

    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.addTask(userId, newTask, taskId);
      } catch (err: any) {
        console.warn("Firestore addTask sync warning:", err?.message || err);
      }
    }
  },

  updateTask: async (id, updates) => {
    const userId = getCurrentUserId();
    let updatedTasks = get().tasks.map((t) => {
      if (t.id === id) {
        const merged = { ...t, ...updates, updatedAt: new Date().toISOString() };
        if (updates.deadline || updates.priority || updates.estimatedHours) {
          merged.urgencyScore = UrgencyService.calculateScore({
            deadline: merged.deadline,
            priority: merged.priority,
            estimatedHours: merged.estimatedHours,
          });
        }
        return merged;
      }
      return t;
    });

    updatedTasks.sort((a, b) => b.urgencyScore - a.urgencyScore);
    set({ tasks: updatedTasks });
    saveLocal("felys_tasks", updatedTasks);
    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.updateTask(userId, id, updates);
      } catch (err: any) {
        console.warn("Firestore updateTask sync warning:", err?.message || err);
      }
    }
  },

  deleteTask: async (id) => {
    const userId = getCurrentUserId();
    const nextTasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks: nextTasks });
    saveLocal("felys_tasks", nextTasks);
    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.deleteTask(userId, id);
      } catch (err: any) {
        console.warn("Firestore deleteTask sync warning:", err?.message || err);
      }
    }
  },

  toggleTaskStatus: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    await get().updateTask(id, { status: nextStatus });
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, isDone: !st.isDone } : st
    );
    const completedCount = updatedSubtasks.filter((st) => st.isDone).length;
    const allDone = completedCount === updatedSubtasks.length && updatedSubtasks.length > 0;

    await get().updateTask(taskId, {
      subtasks: updatedSubtasks,
      completedSubtasksCount: completedCount,
      status: allDone ? "done" : task.status === "done" ? "in_progress" : task.status,
    });
  },

  addSubtask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentSubtasks = task.subtasks || [];
    const newSubtask: SubTask = {
      id: `st_${Date.now()}`,
      taskId,
      title,
      isDone: false,
      order: currentSubtasks.length,
      createdAt: new Date().toISOString(),
    };

    const updatedSubtasks = [...currentSubtasks, newSubtask];
    await get().updateTask(taskId, {
      subtasks: updatedSubtasks,
      totalSubtasksCount: updatedSubtasks.length,
    });
  },

  updateDDayEvent: async (dday) => {
    const userId = getCurrentUserId();
    const updated: DDayEvent = {
      ...dday,
      updatedAt: new Date().toISOString(),
    };

    set({ ddayEvent: updated });

    if (typeof window !== "undefined") {
      localStorage.setItem("felys_dday_title", dday.title);
      localStorage.setItem("felys_dday_date", dday.targetDate);
    }

    if (userId) {
      try {
        await FirestoreService.updateDDayEvent(userId, updated);
      } catch (err) {
        console.warn("Firestore updateDDayEvent warning:", err);
      }
    }
  },

  // Multi-Account & Wallet Actions
  addAccount: async (accountData) => {
    const userId = getCurrentUserId();
    const accId = `acc_${Date.now()}`;
    const newAccount: FinancialAccount = {
      ...accountData,
      id: accId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextAccounts = [...get().accounts, newAccount];
    set({ accounts: nextAccounts });
    saveLocal("felys_accounts", nextAccounts);

    if (userId) {
      try {
        await FirestoreService.addAccount(userId, newAccount, accId);
      } catch (err) {
        console.warn("Firestore addAccount warning:", err);
      }
    }
  },

  updateAccount: async (id, updates) => {
    const userId = getCurrentUserId();
    const nextAccounts = get().accounts.map((a) =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    set({ accounts: nextAccounts });
    saveLocal("felys_accounts", nextAccounts);

    if (userId) {
      try {
        await FirestoreService.updateAccount(userId, id, updates);
      } catch (err) {
        console.warn("Firestore updateAccount warning:", err);
      }
    }
  },

  adjustAccountBalance: async (id, newBalance) => {
    const userId = getCurrentUserId();
    const nextAccounts = get().accounts.map((a) =>
      a.id === id ? { ...a, currentBalance: newBalance, updatedAt: new Date().toISOString() } : a
    );
    set({ accounts: nextAccounts });
    saveLocal("felys_accounts", nextAccounts);

    if (userId) {
      try {
        await FirestoreService.adjustAccountBalance(userId, id, newBalance);
      } catch (err) {
        console.warn("Firestore adjustAccountBalance warning:", err);
      }
    }
  },

  transferBetweenAccounts: async (fromId, toId, amount, note) => {
    const userId = getCurrentUserId();
    const fromAcc = get().accounts.find((a) => a.id === fromId);
    const toAcc = get().accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc || amount <= 0) return;

    const newFromBal = Math.max(0, fromAcc.currentBalance - amount);
    const newToBal = toAcc.currentBalance + amount;

    const nextAccounts = get().accounts.map((a) => {
      if (a.id === fromId) return { ...a, currentBalance: newFromBal, updatedAt: new Date().toISOString() };
      if (a.id === toId) return { ...a, currentBalance: newToBal, updatedAt: new Date().toISOString() };
      return a;
    });

    set({ accounts: nextAccounts });
    saveLocal("felys_accounts", nextAccounts);

    if (userId) {
      try {
        await FirestoreService.adjustAccountBalance(userId, fromId, newFromBal);
        await FirestoreService.adjustAccountBalance(userId, toId, newToBal);
      } catch (err) {
        console.warn("Firestore transferBetweenAccounts warning:", err);
      }
    }
  },

  deleteAccount: async (id) => {
    const userId = getCurrentUserId();
    const nextAccounts = get().accounts.filter((a) => a.id !== id);
    set({ accounts: nextAccounts });
    saveLocal("felys_accounts", nextAccounts);

    if (userId) {
      try {
        await FirestoreService.deleteAccount(userId, id);
      } catch (err) {
        console.warn("Firestore deleteAccount warning:", err);
      }
    }
  },

  getTotalNetWorth: () => {
    const accountsTotal = get().accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    return accountsTotal + (Number(get().emergencyFund) || 0);
  },

  // Finance Actions
  addCategory: async (categoryData) => {
    const userId = getCurrentUserId();
    const catId = `cat_${Date.now()}`;
    const newCat: Category = {
      ...categoryData,
      id: catId,
    };

    const nextCategories = [...get().categories, newCat];
    set({ categories: nextCategories });
    saveLocal("felys_categories", nextCategories);

    if (userId) {
      try {
        await FirestoreService.addCategory(userId, categoryData, catId);
      } catch (err: any) {
        console.warn("Firestore addCategory sync warning:", err?.message || err);
      }
    }
  },

  addTransaction: async (trxData) => {
    const userId = getCurrentUserId();
    const trxId = `trx_${Date.now()}`;
    const newTrx: Transaction = {
      ...trxData,
      id: trxId,
      createdAt: new Date().toISOString(),
    };

    // Auto-update account balance if accountId is attached
    if (trxData.accountId) {
      const targetAcc = get().accounts.find((a) => a.id === trxData.accountId);
      if (targetAcc) {
        const delta = trxData.type === "income" ? trxData.amount : -trxData.amount;
        const newBal = Math.max(0, targetAcc.currentBalance + delta);
        const nextAccounts = get().accounts.map((a) => (a.id === trxData.accountId ? { ...a, currentBalance: newBal } : a));
        set({ accounts: nextAccounts });
        saveLocal("felys_accounts", nextAccounts);

        if (userId) {
          FirestoreService.adjustAccountBalance(userId, trxData.accountId, newBal);
        }
      }
    }

    const nextTransactions = [newTrx, ...get().transactions];
    set({ transactions: nextTransactions });
    saveLocal("felys_transactions", nextTransactions);

    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.addTransaction(userId, newTrx, trxId);
      } catch (err: any) {
        console.warn("Firestore addTransaction sync warning:", err?.message || err);
      }
    }
  },

  deleteTransaction: async (id) => {
    const userId = getCurrentUserId();
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.deleteTransaction(userId, id);
      } catch (err: any) {
        console.warn("Firestore deleteTransaction sync warning:", err?.message || err);
      }
    }
  },

  setBudgetLimit: async (categoryId, monthlyLimit) => {
    const userId = getCurrentUserId();
    set((state) => {
      const existing = state.budgetLimits.filter((b) => b.categoryId !== categoryId);
      return {
        budgetLimits: [...existing, { categoryId, monthlyLimit }],
      };
    });

    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.setBudgetLimit(userId, categoryId, monthlyLimit);
      } catch (err: any) {
        console.warn("Firestore setBudgetLimit sync warning:", err?.message || err);
      }
    }
  },

  deleteBudgetLimit: async (categoryId) => {
    const userId = getCurrentUserId();
    set((state) => ({
      budgetLimits: state.budgetLimits.filter((b) => b.categoryId !== categoryId),
    }));
    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.deleteBudgetLimit(userId, categoryId);
      } catch (err: any) {
        console.warn("Firestore deleteBudgetLimit sync warning:", err?.message || err);
      }
    }
  },

  addRecurringBill: async (billData) => {
    const userId = getCurrentUserId();
    const billId = `bill_${Date.now()}`;
    const newBill: RecurringBill = {
      ...billData,
      id: billId,
      createdAt: new Date().toISOString(),
    };

    const nextBills = [...get().recurringBills, newBill];
    set({ recurringBills: nextBills });
    saveLocal("felys_bills", nextBills);

    if (userId) {
      try {
        await FirestoreService.addRecurringBill(userId, newBill, billId);
      } catch (err) {
        console.warn("Firestore addRecurringBill warning:", err);
      }
    }
  },

  deleteRecurringBill: async (id) => {
    const userId = getCurrentUserId();
    const nextBills = get().recurringBills.filter((b) => b.id !== id);
    set({ recurringBills: nextBills });
    saveLocal("felys_bills", nextBills);

    if (userId) {
      try {
        await FirestoreService.deleteRecurringBill(userId, id);
      } catch (err) {
        console.warn("Firestore deleteRecurringBill warning:", err);
      }
    }
  },

  payRecurringBill: async (id) => {
    const bill = get().recurringBills.find((b) => b.id === id);
    if (!bill) return;

    await get().addTransaction({
      type: "expense",
      amount: bill.amount,
      categoryId: bill.categoryId,
      categoryName: bill.categoryName,
      note: `Bayar Tagihan: ${bill.name}`,
      date: new Date().toISOString(),
    });
  },

  addDebt: async (debtData) => {
    const userId = getCurrentUserId();
    const debtId = `debt_${Date.now()}`;
    const newDebt: FriendDebt = {
      ...debtData,
      id: debtId,
      isSettled: false,
      createdAt: new Date().toISOString(),
    };

    const nextDebts = [...get().debts, newDebt];
    set({ debts: nextDebts });
    saveLocal("felys_debts", nextDebts);

    if (userId) {
      try {
        await FirestoreService.addDebt(userId, newDebt, debtId);
      } catch (err) {
        console.warn("Firestore addDebt warning:", err);
      }
    }
  },

  settleDebt: async (id) => {
    const userId = getCurrentUserId();
    const debt = get().debts.find((d) => d.id === id);
    if (!debt) return;

    if (debt.type === "they_owe_me") {
      await get().addTransaction({
        type: "income",
        amount: debt.amount,
        categoryId: "cat_talangan",
        categoryName: "Pelunasan Talangan",
        note: `Pelunasan talangan dari ${debt.friendName} (${debt.description})`,
        date: new Date().toISOString(),
      });
    }

    const nextDebts = get().debts.map((d) =>
      d.id === id ? { ...d, isSettled: true, settledDate: new Date().toISOString() } : d
    );
    set({ debts: nextDebts });
    saveLocal("felys_debts", nextDebts);

    if (userId) {
      try {
        await FirestoreService.updateDebt(userId, id, { isSettled: true, settledDate: new Date().toISOString() });
      } catch (err) {
        console.warn("Firestore settleDebt warning:", err);
      }
    }
  },

  deleteDebt: async (id) => {
    const userId = getCurrentUserId();
    const nextDebts = get().debts.filter((d) => d.id !== id);
    set({ debts: nextDebts });
    saveLocal("felys_debts", nextDebts);

    if (userId) {
      try {
        await FirestoreService.deleteDebt(userId, id);
      } catch (err) {
        console.warn("Firestore deleteDebt warning:", err);
      }
    }
  },

  addSavingsGoal: async (goalData) => {
    const userId = getCurrentUserId();
    const goalId = `goal_${Date.now()}`;
    const newGoal: SavingsGoal = {
      ...goalData,
      id: goalId,
      currentAmount: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const nextGoals = [...get().savingsGoals, newGoal];
    set({ savingsGoals: nextGoals });
    saveLocal("felys_savings", nextGoals);

    if (userId) {
      try {
        await FirestoreService.addSavingsGoal(userId, newGoal, goalId);
      } catch (err) {
        console.warn("Firestore addSavingsGoal warning:", err);
      }
    }
  },

  depositToSavingsGoal: async (id, amount) => {
    const userId = getCurrentUserId();
    const goal = get().savingsGoals.find((g) => g.id === id);
    if (!goal) return;

    // Record expense transaction (Alokasi Tabungan)
    await get().addTransaction({
      type: "expense",
      amount,
      categoryId: "cat_tabungan",
      categoryName: "Tabungan Impian",
      note: `Setor tabungan: ${goal.title}`,
      date: new Date().toISOString(),
    });

    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;

    const nextGoals = get().savingsGoals.map((g) => {
      if (g.id === id) {
        return {
          ...g,
          currentAmount: newAmount,
          isCompleted,
        };
      }
      return g;
    });
    set({ savingsGoals: nextGoals });
    saveLocal("felys_savings", nextGoals);

    if (userId) {
      try {
        await FirestoreService.updateSavingsGoal(userId, id, { currentAmount: newAmount, isCompleted });
      } catch (err) {
        console.warn("Firestore depositToSavingsGoal warning:", err);
      }
    }
  },

  deleteSavingsGoal: async (id) => {
    const userId = getCurrentUserId();
    const nextGoals = get().savingsGoals.filter((g) => g.id !== id);
    set({ savingsGoals: nextGoals });
    saveLocal("felys_savings", nextGoals);

    if (userId) {
      try {
        await FirestoreService.deleteSavingsGoal(userId, id);
      } catch (err) {
        console.warn("Firestore deleteSavingsGoal warning:", err);
      }
    }
  },

  depositEmergencyFund: async (amount, note) => {
    const userId = getCurrentUserId();
    await get().addTransaction({
      type: "expense",
      amount,
      categoryId: "cat_darurat",
      categoryName: "Dana Darurat",
      note: note || "Simpanan Cadangan Darurat Kos",
      date: new Date().toISOString(),
    });

    const newFund = get().emergencyFund + amount;
    set({ emergencyFund: newFund });
    saveLocal("felys_emergency_fund", newFund);

    if (userId) {
      try {
        await FirestoreService.updateEmergencyFund(userId, newFund);
      } catch (err) {
        console.warn("Firestore depositEmergencyFund warning:", err);
      }
    }
  },

  withdrawEmergencyFund: async (amount, note) => {
    const userId = getCurrentUserId();
    await get().addTransaction({
      type: "income",
      amount,
      categoryId: "cat_darurat",
      categoryName: "Tarik Dana Darurat",
      note: note || "Penarikan Dana Darurat Kos",
      date: new Date().toISOString(),
    });

    const newFund = Math.max(0, get().emergencyFund - amount);
    set({ emergencyFund: newFund });
    saveLocal("felys_emergency_fund", newFund);

    if (userId) {
      try {
        await FirestoreService.updateEmergencyFund(userId, newFund);
      } catch (err) {
        console.warn("Firestore withdrawEmergencyFund warning:", err);
      }
    }
  },

  rolloverSurplus: async (amount) => {
    await get().depositEmergencyFund(amount, "Rollover Sisa Surplus Kas Bulan Lalu");
  },

  getMonthlyBudgetSummary: (month, year) => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    return BudgetService.calculateMonthlySummary({
      month: m,
      year: y,
      categories: get().categories,
      transactions: get().transactions,
      budgets: get().budgetLimits,
    });
  },

  getDailyAllowanceSummary: () => {
    const summary = get().getMonthlyBudgetSummary();
    return BudgetService.calculateDailyAllowance({
      summary,
      transactions: get().transactions,
      recurringBills: get().recurringBills,
    });
  },

  // AI & Insights
  dismissInsight: (id) => {
    set((state) => ({
      insights: state.insights.map((ins) =>
        ins.id === id ? { ...ins, isDismissed: true } : ins
      ),
    }));
  },

  refreshInsights: () => {
    const summary = get().getMonthlyBudgetSummary();
    const cross = InsightService.evaluateCrossModeInsight({
      tasks: get().tasks,
      budgets: summary.categories,
    });

    const taskRec = InsightService.generateTaskRecommendation(get().tasks);
    const budgetAlert = InsightService.generateBudgetAlert(summary.categories);

    const newInsights: AIInsight[] = [];
    if (cross) newInsights.push(cross);
    if (taskRec) newInsights.push(taskRec);
    if (budgetAlert) newInsights.push(budgetAlert);

    set({ insights: newInsights });
  },
}));
