"use client";

import { create } from "zustand";
import { Course, Task, SubTask, PriorityLevel, TaskStatus } from "@/types/academic";
import { Category, Transaction, MonthlyBudgetSummary, Budget } from "@/types/finance";
import { AIInsight } from "@/types/ai";
import { UrgencyService } from "@/server/services/urgency.service";
import { BudgetService } from "@/server/services/budget.service";
import { InsightService } from "@/server/services/insight.service";
import { FirestoreService, ALL_DEFAULT_CATEGORIES } from "@/lib/firebase/firestore-service";
import { auth } from "@/lib/firebase/client";

interface DataState {
  // Real Firestore Data
  courses: Course[];
  tasks: Task[];
  categories: Category[];
  transactions: Transaction[];
  budgetLimits: { categoryId: string; monthlyLimit: number }[];
  insights: AIInsight[];
  isLoaded: boolean;

  // Real-time Firestore sync
  initFirestoreSync: (userId: string) => () => void;

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
  getMonthlyBudgetSummary: (month?: number, year?: number) => MonthlyBudgetSummary;

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
  insights: [],
  isLoaded: false,

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
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.addCourse(user.uid, courseData);
  },

  updateCourse: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.updateCourse(user.uid, id, updates);
  },

  deleteCourse: async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.deleteCourse(user.uid, id);
  },

  addTask: async (taskData) => {
    const user = auth.currentUser;
    if (!user) return;

    const score = UrgencyService.calculateScore({
      deadline: taskData.deadline,
      priority: taskData.priority,
      estimatedHours: taskData.estimatedHours,
    });

    const course = get().courses.find((c) => c.id === taskData.courseId);

    const newTask: Omit<Task, "id"> = {
      ...taskData,
      courseName: course?.name || "Kuliah",
      courseColor: course?.color || "#B69CFF",
      urgencyScore: score,
      completedSubtasksCount: taskData.subtasks?.filter((s) => s.isDone).length || 0,
      totalSubtasksCount: taskData.subtasks?.length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await FirestoreService.addTask(user.uid, newTask);
    get().refreshInsights();
  },

  updateTask: async (id, updates) => {
    const user = auth.currentUser;
    if (!user) return;

    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const merged = { ...task, ...updates };
    merged.urgencyScore = UrgencyService.calculateScore({
      deadline: merged.deadline,
      priority: merged.priority,
      estimatedHours: merged.estimatedHours,
    });

    if (merged.subtasks) {
      merged.completedSubtasksCount = merged.subtasks.filter((s) => s.isDone).length;
      merged.totalSubtasksCount = merged.subtasks.length;
    }

    await FirestoreService.updateTask(user.uid, id, merged);
    get().refreshInsights();
  },

  deleteTask: async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.deleteTask(user.uid, id);
    get().refreshInsights();
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

    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
    );

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.isDone);
    await get().updateTask(taskId, {
      subtasks: updatedSubtasks,
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
      order: currentSubtasks.length + 1,
      createdAt: new Date().toISOString(),
    };

    await get().updateTask(taskId, {
      subtasks: [...currentSubtasks, newSubtask],
    });
  },

  // Finance Actions
  addCategory: async (catData) => {
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.addCategory(user.uid, catData);
  },

  addTransaction: async (trxData) => {
    const user = auth.currentUser;
    if (!user) return;

    const cat = get().categories.find((c) => c.id === trxData.categoryId);
    const newTrx: Omit<Transaction, "id"> = {
      ...trxData,
      categoryName: cat?.name || "Kategori",
      categoryIcon: cat?.icon || "Sparkles",
      categoryColor: cat?.color || "#7FE3C0",
      createdAt: new Date().toISOString(),
    };

    await FirestoreService.addTransaction(user.uid, newTrx);
    get().refreshInsights();
  },

  deleteTransaction: async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.deleteTransaction(user.uid, id);
    get().refreshInsights();
  },

  setBudgetLimit: async (categoryId, monthlyLimit) => {
    const user = auth.currentUser;
    if (!user) return;
    await FirestoreService.setBudgetLimit(user.uid, categoryId, monthlyLimit);
    get().refreshInsights();
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
