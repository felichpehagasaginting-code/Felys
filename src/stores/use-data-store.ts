"use client";

import { create } from "zustand";
import { Course, Task, SubTask, PriorityLevel, TaskStatus } from "@/types/academic";
import { Category, Transaction, MonthlyBudgetSummary, Budget, RecurringBill, FriendDebt, DailyAllowanceSummary } from "@/types/finance";
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
  categories: Category[];
  transactions: Transaction[];
  budgetLimits: { categoryId: string; monthlyLimit: number }[];
  recurringBills: RecurringBill[];
  debts: FriendDebt[];
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

  // AI Actions
  dismissInsight: (id: string) => void;
  refreshInsights: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  courses: [],
  tasks: [],
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
      friendName: "Andi Pratama",
      friendPhone: "081234567890",
      amount: 35000,
      description: "Talangan Makan Siang Nasi Padang",
      type: "they_owe_me",
      isSettled: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "debt_2",
      friendName: "Siti Rahma",
      friendPhone: "089876543210",
      amount: 15000,
      description: "Patungan Print & Jilid Makalah AI",
      type: "they_owe_me",
      isSettled: false,
      createdAt: new Date().toISOString(),
    },
  ],
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
      insights: [],
      isLoaded: false,
    });
  },

  // Real-time Firestore synchronizer
  initFirestoreSync: (userId: string) => {
    // 1. Ensure categories are seeded in Firestore if brand new user
    FirestoreService.seedDefaultCategoriesIfEmpty(userId);

    // 2. Subscribe to real-time collections
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

    return () => {
      unsubCourses();
      unsubTasks();
      unsubCategories();
      unsubTransactions();
      unsubBudgets();
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

    // Optimistic update
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
    const taskId = `task_${Date.now()}`;

    const score = UrgencyService.calculateScore({
      deadline: taskData.deadline,
      priority: taskData.priority,
      estimatedHours: taskData.estimatedHours,
    });

    const course = get().courses.find((c) => c.id === taskData.courseId);

    const newTask: Task = {
      ...taskData,
      id: taskId,
      courseId: course?.id || taskData.courseId || "general",
      courseName: course?.name || (taskData.courseId === "general" ? "Umum / Kuliah" : "Kuliah"),
      courseColor: course?.color || "#B69CFF",
      urgencyScore: score,
      completedSubtasksCount: taskData.subtasks?.filter((s) => s.isDone).length || 0,
      totalSubtasksCount: taskData.subtasks?.length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
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
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const merged = { ...task, ...updates, updatedAt: new Date().toISOString() };
    merged.urgencyScore = UrgencyService.calculateScore({
      deadline: merged.deadline,
      priority: merged.priority,
      estimatedHours: merged.estimatedHours,
    });

    if (merged.subtasks) {
      merged.completedSubtasksCount = merged.subtasks.filter((s) => s.isDone).length;
      merged.totalSubtasksCount = merged.subtasks.length;
    }

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? merged : t)),
    }));
    get().refreshInsights();

    if (userId) {
      try {
        await FirestoreService.updateTask(userId, id, merged);
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
    const nextStatus = task.status === "done" ? "todo" : "done";
    await get().updateTask(id, { status: nextStatus });
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
    );
    await get().updateTask(taskId, { subtasks: nextSubtasks });
  },

  addSubtask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentSubtasks = task.subtasks || [];
    const newSubtask: SubTask = {
      id: `sub_${Date.now()}`,
      taskId,
      title,
      isDone: false,
      order: currentSubtasks.length + 1,
      createdAt: new Date().toISOString(),
    };

    const nextSubtasks = [...currentSubtasks, newSubtask];
    await get().updateTask(taskId, { subtasks: nextSubtasks });
  },

  // Finance Actions
  addCategory: async (categoryData) => {
    const userId = getCurrentUserId();
    const catId = `cat_${Date.now()}`;
    const newCat: Category = {
      ...categoryData,
      id: catId,
      createdAt: new Date().toISOString(),
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
    const cat = get().categories.find(
      (c) =>
        c.id === trxData.categoryId ||
        c.name.toLowerCase() === trxData.categoryName?.toLowerCase()
    );

    const newTrx: Transaction = {
      ...trxData,
      id: trxId,
      categoryId: cat?.id || trxData.categoryId,
      categoryName: cat?.name || trxData.categoryName || "Kategori",
      categoryIcon: cat?.icon || trxData.categoryIcon || "Sparkles",
      categoryColor: cat?.color || trxData.categoryColor || "#7FE3C0",
      createdAt: new Date().toISOString(),
    };

    // Optimistic local update (instant feedback, never hangs)
    set((state) => ({ transactions: [newTrx, ...state.transactions] }));
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
    const cat = get().categories.find((c) => c.id === categoryId);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const newBudget: Budget = {
      id: `${year}_${month}_${categoryId}`,
      categoryId,
      categoryName: cat?.name || "Kategori",
      categoryColor: cat?.color || "#7FE3C0",
      categoryIcon: cat?.icon || "Sparkles",
      isEssential: cat?.isEssential ?? true,
      monthlyLimit,
      month,
      year,
      spentAmount: 0,
      remainingAmount: monthlyLimit,
      usedPercentage: 0,
      status: "safe",
      updatedAt: now.toISOString(),
    };

    set((state) => ({
      budgetLimits: [
        ...state.budgetLimits.filter((b) => b.categoryId !== categoryId),
        newBudget,
      ],
    }));
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
    const newBill: RecurringBill = {
      ...billData,
      id: `bill_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      recurringBills: [...state.recurringBills, newBill],
    }));
  },

  deleteRecurringBill: async (id) => {
    set((state) => ({
      recurringBills: state.recurringBills.filter((b) => b.id !== id),
    }));
  },

  payRecurringBill: async (id) => {
    const bill = get().recurringBills.find((b) => b.id === id);
    if (!bill) return;

    // Record transaction
    await get().addTransaction({
      type: "expense",
      amount: bill.amount,
      categoryId: bill.categoryId,
      categoryName: bill.categoryName || "Tagihan",
      note: `Bayar ${bill.name}`,
      date: new Date().toISOString(),
    });

    // Mark last paid date
    set((state) => ({
      recurringBills: state.recurringBills.map((b) =>
        b.id === id ? { ...b, lastPaidDate: new Date().toISOString() } : b
      ),
    }));
  },

  addDebt: async (debtData) => {
    const newDebt: FriendDebt = {
      ...debtData,
      id: `debt_${Date.now()}`,
      isSettled: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      debts: [newDebt, ...state.debts],
    }));
  },

  settleDebt: async (id) => {
    const debt = get().debts.find((d) => d.id === id);
    if (!debt || debt.isSettled) return;

    // If they owe me money, registering repayment counts as income
    if (debt.type === "they_owe_me") {
      await get().addTransaction({
        type: "income",
        amount: debt.amount,
        categoryId: "cat_saku",
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
  },

  deleteDebt: async (id) => {
    set((state) => ({
      debts: state.debts.filter((d) => d.id !== id),
    }));
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
