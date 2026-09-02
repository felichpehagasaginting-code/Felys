"use client";

import { create } from "zustand";
import { Course, Task, SubTask, PriorityLevel, TaskStatus, DDayEvent } from "@/types/academic";
import { Category, Transaction, MonthlyBudgetSummary, Budget, RecurringBill, FriendDebt, DailyAllowanceSummary, SavingsGoal } from "@/types/finance";
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

interface DataState {
  // Real Firestore Data
  courses: Course[];
  tasks: Task[];
  ddayEvent: DDayEvent;
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
  courses: [],
  tasks: [],
  ddayEvent: {
    title: "Ujian Tengah Semester (UTS)",
    targetDate: "2026-09-21",
  },
  categories: [],
  transactions: [],
  budgetLimits: [],
  recurringBills: [
    {
      id: "bill_kos",
      name: "Uang Kos Bulanan",
      amount: 850000,
      categoryId: "cat_tagihan",
      categoryName: "Tagihan & Kos",
      frequency: "monthly",
      dueDay: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "bill_wifi",
      name: "Iuran WiFi & Kuota",
      amount: 75000,
      categoryId: "cat_tagihan",
      categoryName: "Tagihan & Kos",
      frequency: "monthly",
      dueDay: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "bill_ukt",
      name: "UKT / SPP Semester Ganjil",
      amount: 3500000,
      categoryId: "cat_kuliah",
      categoryName: "Kebutuhan Kuliah",
      frequency: "semester",
      dueDay: 20,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  debts: [
    {
      id: "debt_1",
      friendName: "Rian",
      amount: 45000,
      description: "Makan Ayam Geprek bareng",
      type: "they_owe_me",
      isSettled: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "debt_2",
      friendName: "Sarah",
      amount: 25000,
      description: "Fotokopi Diktat Kuliah",
      type: "they_owe_me",
      isSettled: false,
      createdAt: new Date().toISOString(),
    },
  ],
  savingsGoals: [
    {
      id: "goal_1",
      title: "Tabungan Laptop Kuliah Baru",
      targetAmount: 6000000,
      currentAmount: 1850000,
      categoryIcon: "Laptop",
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "goal_2",
      title: "Liburan Semester ke Jogja",
      targetAmount: 1200000,
      currentAmount: 750000,
      categoryIcon: "Sparkles",
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
  ],
  emergencyFund: 450000,
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
        if (typeof window !== "undefined") {
          localStorage.setItem("felys_dday_title", data.ddayEvent.title);
          localStorage.setItem("felys_dday_date", data.ddayEvent.targetDate);
        }
      }
      if (typeof data.emergencyFund === "number") {
        set({ emergencyFund: data.emergencyFund });
      }
    });

    // 3. Subscribe to real-time collections
    const unsubCourses = FirestoreService.subscribeCourses(userId, (courses) => {
      set({ courses });
      get().refreshInsights();
    });

    const unsubTasks = FirestoreService.subscribeTasks(userId, (tasks) => {
      set({ tasks });
      get().refreshInsights();
    });

    const unsubCategories = FirestoreService.subscribeCategories(userId, (categories) => {
      set({ categories });
      get().refreshInsights();
    });

    const unsubTransactions = FirestoreService.subscribeTransactions(userId, (transactions) => {
      set({ transactions });
      get().refreshInsights();
    });

    const unsubBudgets = FirestoreService.subscribeBudgets(userId, (budgetLimits) => {
      set({ budgetLimits, isLoaded: true });
      get().refreshInsights();
    });

    const unsubSavings = FirestoreService.subscribeSavingsGoals(userId, (savingsGoals) => {
      if (savingsGoals.length > 0) {
        set({ savingsGoals });
      }
    });

    const unsubBills = FirestoreService.subscribeRecurringBills(userId, (recurringBills) => {
      if (recurringBills.length > 0) {
        set({ recurringBills });
      }
    });

    const unsubDebts = FirestoreService.subscribeDebts(userId, (debts) => {
      if (debts.length > 0) {
        set({ debts });
      }
    });

    return () => {
      unsubProfile();
      unsubCourses();
      unsubTasks();
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

    set((state) => ({ courses: [...state.courses, newCourse] }));

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
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));

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
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
      tasks: state.tasks.filter((t) => t.courseId !== id),
    }));

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

    set((state) => ({
      tasks: [...state.tasks, newTask].sort((a, b) => b.urgencyScore - a.urgencyScore),
    }));

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
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
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

  // Finance Actions
  addCategory: async (categoryData) => {
    const userId = getCurrentUserId();
    const catId = `cat_${Date.now()}`;
    const newCat: Category = {
      ...categoryData,
      id: catId,
    };

    set((state) => ({ categories: [...state.categories, newCat] }));

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

    set((state) => ({
      transactions: [newTrx, ...state.transactions],
    }));

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

    set((state) => ({
      recurringBills: [...state.recurringBills, newBill],
    }));

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
    set((state) => ({
      recurringBills: state.recurringBills.filter((b) => b.id !== id),
    }));

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

    set((state) => ({
      debts: [...state.debts, newDebt],
    }));

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

    set((state) => ({
      debts: state.debts.map((d) =>
        d.id === id ? { ...d, isSettled: true, settledDate: new Date().toISOString() } : d
      ),
    }));

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
    set((state) => ({
      debts: state.debts.filter((d) => d.id !== id),
    }));

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

    set((state) => ({
      savingsGoals: [...state.savingsGoals, newGoal],
    }));

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

    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            currentAmount: newAmount,
            isCompleted,
          };
        }
        return g;
      }),
    }));

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
    set((state) => ({
      savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
    }));

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
