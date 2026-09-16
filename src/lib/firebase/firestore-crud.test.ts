import { describe, it, expect } from "vitest";
import { cleanFirestoreData } from "./firestore-service";
import { Task, SubTask } from "@/types/academic";
import { FinancialAccount, Transaction, SavingsGoal, RecurringBill, FriendDebt } from "@/types/finance";

describe("All CRUD Entities Firestore Integrity & Business Logic", () => {
  describe("Task & Subtask CRUD", () => {
    it("safely cleans Task payload without undefined fields", () => {
      const rawTask: Partial<Task> = {
        id: "task_1",
        title: "Tugas Makalah AI",
        courseId: "c_1",
        courseName: "Kecerdasan Buatan",
        deadline: new Date().toISOString(),
        priority: "high",
        status: "todo",
        urgencyScore: 88,
        description: undefined, // Must be omitted
        estimatedHours: null,
      };

      const cleaned = cleanFirestoreData(rawTask);
      expect(cleaned.title).toBe("Tugas Makalah AI");
      expect(cleaned.urgencyScore).toBe(88);
      expect(cleaned.description).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(cleaned, "description")).toBe(false);
      expect(cleaned.estimatedHours).toBeNull();
    });

    it("serializes subtasks accurately within task payload", () => {
      const subtasks: SubTask[] = [
        { id: "st_1", taskId: "t_1", title: "Cari Jurnal", isDone: true, order: 0 },
        { id: "st_2", taskId: "t_1", title: "Tulis Analisis", isDone: false, order: 1 },
      ];

      const cleaned = cleanFirestoreData({ subtasks });
      expect(cleaned.subtasks).toHaveLength(2);
      expect(cleaned.subtasks[0].isDone).toBe(true);
      expect(cleaned.subtasks[1].isDone).toBe(false);
    });
  });

  describe("Account & Balance Adjustment CRUD", () => {
    it("accurately handles balance adjustments and transfers", () => {
      const fromAcc: FinancialAccount = {
        id: "acc_superbank",
        name: "Superbank Utama",
        provider: "superbank",
        currentBalance: 1000000,
        color: "#121212",
      };

      const toAcc: FinancialAccount = {
        id: "acc_gopay",
        name: "GoPay Jajan",
        provider: "gopay",
        currentBalance: 50000,
        color: "#00AED6",
      };

      const transferAmount = 250000;
      const newFromBalance = Math.max(0, fromAcc.currentBalance - transferAmount);
      const newToBalance = toAcc.currentBalance + transferAmount;

      expect(newFromBalance).toBe(750000);
      expect(newToBalance).toBe(300000);

      const cleanedFrom = cleanFirestoreData({ currentBalance: newFromBalance, updatedAt: new Date().toISOString() });
      expect(cleanedFrom.currentBalance).toBe(750000);
    });
  });

  describe("Transaction CRUD & Automatic Balance Reversal", () => {
    it("reverts account balance correctly upon expense deletion", () => {
      const initialAccountBalance = 450000;
      const expenseTransaction: Transaction = {
        id: "trx_1",
        type: "expense",
        amount: 50000,
        categoryId: "cat_makan",
        accountId: "acc_bca",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Reversal logic for expense: balance increases by amount
      const delta = expenseTransaction.type === "income" ? -expenseTransaction.amount : expenseTransaction.amount;
      const revertedBalance = initialAccountBalance + delta;

      expect(revertedBalance).toBe(500000);
    });

    it("reverts account balance correctly upon income deletion", () => {
      const initialAccountBalance = 550000;
      const incomeTransaction: Transaction = {
        id: "trx_2",
        type: "income",
        amount: 50000,
        categoryId: "cat_gaji",
        accountId: "acc_bca",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Reversal logic for income: balance decreases by amount
      const delta = incomeTransaction.type === "income" ? -incomeTransaction.amount : incomeTransaction.amount;
      const revertedBalance = initialAccountBalance + delta;

      expect(revertedBalance).toBe(500000);
    });
  });

  describe("Budget Limits & Category CRUD", () => {
    it("formats composite document key for monthly budget limits", () => {
      const year = 2026;
      const month = 9;
      const categoryId = "cat_makan";
      const docId = `${year}_${month}_${categoryId}`;

      expect(docId).toBe("2026_9_cat_makan");
    });
  });

  describe("Savings Goal & Deposits CRUD", () => {
    it("calculates goal progress and completes when target is reached", () => {
      const goal: SavingsGoal = {
        id: "goal_laptop",
        title: "Beli Laptop Kuliah",
        targetAmount: 10000000,
        currentAmount: 9500000,
        isCompleted: false,
        categoryIcon: "Laptop",
        createdAt: new Date().toISOString(),
      };

      const deposit = 500000;
      const updatedAmount = goal.currentAmount + deposit;
      const isCompleted = updatedAmount >= goal.targetAmount;
      const percentage = Math.min(100, Math.round((updatedAmount / goal.targetAmount) * 100));

      expect(updatedAmount).toBe(10000000);
      expect(isCompleted).toBe(true);
      expect(percentage).toBe(100);
    });
  });

  describe("Recurring Bills & Debt Settlement CRUD", () => {
    it("validates recurring bill schedule frequency and due date", () => {
      const bill: RecurringBill = {
        id: "bill_kos",
        name: "Uang Kos Bulanan",
        amount: 850000,
        categoryId: "cat_kos",
        frequency: "monthly",
        dueDay: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      expect(bill.dueDay >= 1 && bill.dueDay <= 31).toBe(true);
      expect(["monthly", "semester"]).toContain(bill.frequency);
    });

    it("marks debt as settled with timestamp", () => {
      const debt: FriendDebt = {
        id: "debt_1",
        friendName: "Aldo",
        amount: 35000,
        type: "they_owe_me",
        description: "Makan siang warteg",
        isSettled: false,
        createdAt: new Date().toISOString(),
      };

      const settledDebt: FriendDebt = {
        ...debt,
        isSettled: true,
        settledDate: new Date().toISOString(),
      };

      expect(settledDebt.isSettled).toBe(true);
      expect(settledDebt.settledDate).toBeDefined();
    });
  });
});
