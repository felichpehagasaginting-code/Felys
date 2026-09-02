import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./client";
import { Course, Task, DDayEvent } from "@/types/academic";
import { Category, Transaction, SavingsGoal, RecurringBill, FriendDebt, FinancialAccount } from "@/types/finance";
import { UserProfile } from "@/types/user";

/**
 * Remove undefined values and convert nested structures for safe Firestore serialization.
 * Firebase Web SDK throws fatal runtime errors if any field value is undefined.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // omit undefined keys completely
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = cleanFirestoreData(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === "object" && !(item instanceof Date)
          ? cleanFirestoreData(item)
          : item
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// Lengkap: Kategori Pengeluaran & Pemasukan Mahasiswa
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Makan & Minum", icon: "Utensils", color: "#7FE3C0", isEssential: true, type: "expense", isDefault: true },
  { name: "Transportasi", icon: "Bus", color: "#6BCB77", isEssential: true, type: "expense", isDefault: true },
  { name: "Kebutuhan Kuliah", icon: "GraduationCap", color: "#B69CFF", isEssential: true, type: "expense", isDefault: true },
  { name: "Tagihan & Kos", icon: "Home", color: "#8EC8FF", isEssential: true, type: "expense", isDefault: true },
  { name: "Laundry & Cuci Baju", icon: "Shirt", color: "#38BDF8", isEssential: true, type: "expense", isDefault: true },
  { name: "Hiburan & Nongkrong", icon: "Gamepad2", color: "#FFC978", isEssential: false, type: "expense", isDefault: true },
  { name: "Kopi & Jajan", icon: "Coffee", color: "#F59E0B", isEssential: false, type: "expense", isDefault: true },
  { name: "Belanja Pribadi", icon: "ShoppingBag", color: "#FF7A85", isEssential: false, type: "expense", isDefault: true },
  { name: "Kesehatan & Obat", icon: "HeartPulse", color: "#F43F5E", isEssential: true, type: "expense", isDefault: true },
  { name: "Langganan & Pulsa", icon: "Laptop", color: "#8B5CF6", isEssential: false, type: "expense", isDefault: true },
  { name: "Pengeluaran Lain", icon: "Sparkles", color: "#94A3B8", isEssential: false, type: "expense", isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Uang Saku & Ortu", icon: "Wallet", color: "#7FE3C0", isEssential: true, type: "income", isDefault: true },
  { name: "Gaji / Part-time", icon: "Briefcase", color: "#38BDF8", isEssential: true, type: "income", isDefault: true },
  { name: "Beasiswa", icon: "Award", color: "#A855F7", isEssential: true, type: "income", isDefault: true },
  { name: "Freelance / Projek", icon: "Laptop", color: "#10B981", isEssential: true, type: "income", isDefault: true },
  { name: "Jualan & Usaha", icon: "Store", color: "#EC4899", isEssential: false, type: "income", isDefault: true },
  { name: "Hadiah & Bonus", icon: "Gift", color: "#F59E0B", isEssential: false, type: "income", isDefault: true },
  { name: "Investasi / Cashback", icon: "TrendingUp", color: "#06B6D4", isEssential: false, type: "income", isDefault: true },
  { name: "Pemasukan Lain", icon: "Sparkles", color: "#94A3B8", isEssential: false, type: "income", isDefault: true },
];

export const ALL_DEFAULT_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
export const DEFAULT_CATEGORIES = ALL_DEFAULT_CATEGORIES;

export class FirestoreService {
  /**
   * Sync or create user profile document in Firestore (/users/{userId})
   */
  public static async syncUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      const cleanData = cleanFirestoreData({
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(userRef, cleanData, { merge: true });
    } catch (e) {
      console.warn("Error syncing user profile to Firestore:", e);
    }
  }

  /**
   * Subscribe to user document (D-Day event, emergency fund, preferences)
   */
  public static subscribeUserProfile(
    userId: string,
    callback: (data: { ddayEvent?: DDayEvent; emergencyFund?: number; scratchpadText?: string }) => void
  ) {
    const userRef = doc(db, "users", userId);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          callback({
            ddayEvent: d.ddayEvent,
            emergencyFund: typeof d.emergencyFund === "number" ? d.emergencyFund : undefined,
            scratchpadText: d.scratchpadText,
          });
        }
      },
      (error) => console.warn("UserProfile listener error:", error)
    );
  }

  /**
   * Update D-Day Countdown Event in Firestore
   */
  public static async updateDDayEvent(userId: string, dday: DDayEvent): Promise<void> {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      cleanFirestoreData({
        ddayEvent: {
          ...dday,
          updatedAt: new Date().toISOString(),
        },
      }),
      { merge: true }
    );
  }

  /**
   * Update Emergency Fund Balance in Firestore
   */
  public static async updateEmergencyFund(userId: string, amount: number): Promise<void> {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      cleanFirestoreData({
        emergencyFund: amount,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  }

  /**
   * Seed default categories if user has no categories in Firestore
   */
  public static async seedDefaultCategoriesIfEmpty(userId: string): Promise<void> {
    try {
      const catRef = collection(db, "users", userId, "categories");
      const snap = await getDocs(catRef);

      if (snap.empty) {
        for (const cat of ALL_DEFAULT_CATEGORIES) {
          await addDoc(catRef, cleanFirestoreData({
            ...cat,
            createdAt: new Date().toISOString(),
          }));
        }
      }
    } catch (e) {
      console.warn("Error seeding categories to Firestore:", e);
    }
  }

  /**
   * Automatically migrate and push any local offline data (e.g. Superbank, tasks, courses) to Firestore on login
   */
  public static async syncLocalDataToFirestore(
    userId: string,
    localData: {
      accounts?: FinancialAccount[];
      courses?: Course[];
      tasks?: Task[];
      transactions?: Transaction[];
      ddayEvent?: DDayEvent;
      savingsGoals?: SavingsGoal[];
      recurringBills?: RecurringBill[];
      debts?: FriendDebt[];
      emergencyFund?: number;
    }
  ): Promise<void> {
    try {
      // 1. Sync accounts (e.g. Superbank, SeaBank, GoPay)
      if (localData.accounts && localData.accounts.length > 0) {
        for (const acc of localData.accounts) {
          const ref = doc(db, "users", userId, "accounts", acc.id);
          await setDoc(ref, cleanFirestoreData(acc), { merge: true });
        }
      }

      // 2. Sync courses
      if (localData.courses && localData.courses.length > 0) {
        for (const course of localData.courses) {
          const ref = doc(db, "users", userId, "courses", course.id);
          await setDoc(ref, cleanFirestoreData(course), { merge: true });
        }
      }

      // 3. Sync tasks
      if (localData.tasks && localData.tasks.length > 0) {
        for (const task of localData.tasks) {
          const ref = doc(db, "users", userId, "tasks", task.id);
          await setDoc(ref, cleanFirestoreData(task), { merge: true });
        }
      }

      // 4. Sync transactions
      if (localData.transactions && localData.transactions.length > 0) {
        for (const trx of localData.transactions) {
          const ref = doc(db, "users", userId, "transactions", trx.id);
          await setDoc(ref, cleanFirestoreData(trx), { merge: true });
        }
      }

      // 5. Sync profile (dday, emergency fund)
      if (localData.ddayEvent?.targetDate || typeof localData.emergencyFund === "number") {
        const userRef = doc(db, "users", userId);
        await setDoc(
          userRef,
          cleanFirestoreData({
            ...(localData.ddayEvent ? { ddayEvent: localData.ddayEvent } : {}),
            ...(typeof localData.emergencyFund === "number" ? { emergencyFund: localData.emergencyFund } : {}),
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      }
    } catch (e) {
      console.warn("Error migrating local data to Firestore:", e);
    }
  }

  // --- COURSES ---
  public static subscribeCourses(userId: string, callback: (courses: Course[]) => void) {
    const ref = collection(db, "users", userId, "courses");
    return onSnapshot(
      ref,
      (snapshot) => {
        const courses: Course[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Course, "id">),
          id: d.id,
        }));
        callback(courses);
      },
      (error) => console.warn("Courses listener error:", error)
    );
  }

  public static async addCourse(userId: string, course: Omit<Course, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "courses")).id;
    const ref = doc(db, "users", userId, "courses", docId);
    const payload = cleanFirestoreData({
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async updateCourse(userId: string, courseId: string, updates: Partial<Course>): Promise<void> {
    const ref = doc(db, "users", userId, "courses", courseId);
    const payload = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(ref, payload);
  }

  public static async deleteCourse(userId: string, courseId: string): Promise<void> {
    const ref = doc(db, "users", userId, "courses", courseId);
    await deleteDoc(ref);
  }

  // --- TASKS ---
  public static subscribeTasks(userId: string, callback: (tasks: Task[]) => void) {
    const ref = collection(db, "users", userId, "tasks");
    return onSnapshot(
      ref,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Task, "id">),
          id: d.id,
        }));
        callback(tasks);
      },
      (error) => console.warn("Tasks listener error:", error)
    );
  }

  public static async addTask(userId: string, task: Omit<Task, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "tasks")).id;
    const ref = doc(db, "users", userId, "tasks", docId);
    const payload = cleanFirestoreData({
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<void> {
    const ref = doc(db, "users", userId, "tasks", taskId);
    const payload = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(ref, payload);
  }

  public static async deleteTask(userId: string, taskId: string): Promise<void> {
    const ref = doc(db, "users", userId, "tasks", taskId);
    await deleteDoc(ref);
  }

  // --- CATEGORIES ---
  public static subscribeCategories(userId: string, callback: (categories: Category[]) => void) {
    const ref = collection(db, "users", userId, "categories");
    return onSnapshot(
      ref,
      (snapshot) => {
        const categories: Category[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Category, "id">),
          id: d.id,
        }));
        callback(categories);
      },
      (error) => console.warn("Categories listener error:", error)
    );
  }

  public static async addCategory(userId: string, category: Omit<Category, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "categories")).id;
    const ref = doc(db, "users", userId, "categories", docId);
    const payload = cleanFirestoreData({
      ...category,
      createdAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  // --- TRANSACTIONS ---
  public static subscribeTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
    const ref = collection(db, "users", userId, "transactions");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: Transaction[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Transaction, "id">),
          id: d.id,
        }));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(list);
      },
      (error) => console.warn("Transactions listener error:", error)
    );
  }

  public static async addTransaction(userId: string, transaction: Omit<Transaction, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "transactions")).id;
    const ref = doc(db, "users", userId, "transactions", docId);
    const payload = cleanFirestoreData({
      ...transaction,
      createdAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const ref = doc(db, "users", userId, "transactions", transactionId);
    await deleteDoc(ref);
  }

  // --- BUDGETS ---
  public static subscribeBudgets(
    userId: string,
    callback: (limits: { categoryId: string; monthlyLimit: number }[]) => void
  ) {
    const ref = collection(db, "users", userId, "budgets");
    return onSnapshot(
      ref,
      (snapshot) => {
        const limits = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            categoryId: data.categoryId,
            monthlyLimit: Number(data.monthlyLimit) || 0,
          };
        });
        callback(limits);
      },
      (error) => console.warn("Budgets listener error:", error)
    );
  }

  public static async setBudgetLimit(
    userId: string,
    categoryId: string,
    monthlyLimit: number
  ): Promise<void> {
    const ref = doc(db, "users", userId, "budgets", categoryId);
    const payload = cleanFirestoreData({
      categoryId,
      monthlyLimit,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, payload, { merge: true });
  }

  public static async deleteBudgetLimit(userId: string, categoryId: string): Promise<void> {
    const ref = doc(db, "users", userId, "budgets", categoryId);
    await deleteDoc(ref);
  }

  // --- SAVINGS GOALS (CELENGAN IMPIAN) ---
  public static subscribeSavingsGoals(userId: string, callback: (goals: SavingsGoal[]) => void) {
    const ref = collection(db, "users", userId, "savings_goals");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: SavingsGoal[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<SavingsGoal, "id">),
          id: d.id,
        }));
        callback(list);
      },
      (error) => console.warn("Savings goals listener error:", error)
    );
  }

  public static async addSavingsGoal(userId: string, goal: Omit<SavingsGoal, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "savings_goals")).id;
    const ref = doc(db, "users", userId, "savings_goals", docId);
    const payload = cleanFirestoreData({
      ...goal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async updateSavingsGoal(userId: string, goalId: string, updates: Partial<SavingsGoal>): Promise<void> {
    const ref = doc(db, "users", userId, "savings_goals", goalId);
    const payload = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(ref, payload);
  }

  public static async deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
    const ref = doc(db, "users", userId, "savings_goals", goalId);
    await deleteDoc(ref);
  }

  // --- RECURRING BILLS (TAGIHAN KOS/UKT/WIFI) ---
  public static subscribeRecurringBills(userId: string, callback: (bills: RecurringBill[]) => void) {
    const ref = collection(db, "users", userId, "recurring_bills");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: RecurringBill[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<RecurringBill, "id">),
          id: d.id,
        }));
        callback(list);
      },
      (error) => console.warn("Recurring bills listener error:", error)
    );
  }

  public static async addRecurringBill(userId: string, bill: Omit<RecurringBill, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "recurring_bills")).id;
    const ref = doc(db, "users", userId, "recurring_bills", docId);
    const payload = cleanFirestoreData({
      ...bill,
      createdAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async deleteRecurringBill(userId: string, billId: string): Promise<void> {
    const ref = doc(db, "users", userId, "recurring_bills", billId);
    await deleteDoc(ref);
  }

  // --- DEBTS & SPLIT BILL (TALANGAN TEMAN) ---
  public static subscribeDebts(userId: string, callback: (debts: FriendDebt[]) => void) {
    const ref = collection(db, "users", userId, "debts");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: FriendDebt[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<FriendDebt, "id">),
          id: d.id,
        }));
        callback(list);
      },
      (error) => console.warn("Debts listener error:", error)
    );
  }

  public static async addDebt(userId: string, debt: Omit<FriendDebt, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "debts")).id;
    const ref = doc(db, "users", userId, "debts", docId);
    const payload = cleanFirestoreData({
      ...debt,
      createdAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async updateDebt(userId: string, debtId: string, updates: Partial<FriendDebt>): Promise<void> {
    const ref = doc(db, "users", userId, "debts", debtId);
    const payload = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(ref, payload);
  }

  public static async deleteDebt(userId: string, debtId: string): Promise<void> {
    const ref = doc(db, "users", userId, "debts", debtId);
    await deleteDoc(ref);
  }

  // --- FINANCIAL ACCOUNTS (DOMPET & REKENING MULTI-PLATFORM) ---
  public static subscribeAccounts(userId: string, callback: (accounts: FinancialAccount[]) => void) {
    const ref = collection(db, "users", userId, "accounts");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: FinancialAccount[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<FinancialAccount, "id">),
          id: d.id,
        }));
        callback(list);
      },
      (error) => console.warn("Accounts listener error:", error)
    );
  }

  public static async addAccount(userId: string, account: Omit<FinancialAccount, "id">, customId?: string): Promise<string> {
    const docId = customId || doc(collection(db, "users", userId, "accounts")).id;
    const ref = doc(db, "users", userId, "accounts", docId);
    const payload = cleanFirestoreData({
      ...account,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return docId;
  }

  public static async updateAccount(userId: string, accountId: string, updates: Partial<FinancialAccount>): Promise<void> {
    const ref = doc(db, "users", userId, "accounts", accountId);
    const payload = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(ref, payload);
  }

  public static async adjustAccountBalance(userId: string, accountId: string, newBalance: number): Promise<void> {
    const ref = doc(db, "users", userId, "accounts", accountId);
    await updateDoc(ref, {
      currentBalance: newBalance,
      updatedAt: new Date().toISOString(),
    });
  }

  public static async deleteAccount(userId: string, accountId: string): Promise<void> {
    const ref = doc(db, "users", userId, "accounts", accountId);
    await deleteDoc(ref);
  }
}
