import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./client";
import { Course, Task } from "@/types/academic";
import { Category, Transaction } from "@/types/finance";

// Lengkap: Kategori Pengeluaran & Pemasukan Mahasiswa
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Makan & Minum", icon: "Utensils", color: "#7FE3C0", isEssential: true, type: "expense", isDefault: true },
  { name: "Transportasi", icon: "Bus", color: "#6BCB77", isEssential: true, type: "expense", isDefault: true },
  { name: "Kebutuhan Kuliah", icon: "GraduationCap", color: "#B69CFF", isEssential: true, type: "expense", isDefault: true },
  { name: "Tagihan & Kos", icon: "Home", color: "#8EC8FF", isEssential: true, type: "expense", isDefault: true },
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
   * Seed default categories if user has no categories in Firestore
   */
  public static async seedDefaultCategoriesIfEmpty(userId: string): Promise<void> {
    try {
      const catRef = collection(db, "users", userId, "categories");
      const snap = await getDocs(catRef);

      if (snap.empty) {
        for (const cat of ALL_DEFAULT_CATEGORIES) {
          await addDoc(catRef, {
            ...cat,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn("Error seeding categories to Firestore:", e);
    }
  }

  // --- COURSES ---
  public static subscribeCourses(userId: string, callback: (courses: Course[]) => void) {
    const ref = collection(db, "users", userId, "courses");
    return onSnapshot(
      ref,
      (snapshot) => {
        const courses: Course[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Course, "id">),
        }));
        callback(courses);
      },
      (error) => console.warn("Courses listener error:", error)
    );
  }

  public static async addCourse(userId: string, course: Omit<Course, "id">): Promise<string> {
    const ref = collection(db, "users", userId, "courses");
    const docRef = await addDoc(ref, {
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  public static async updateCourse(userId: string, courseId: string, updates: Partial<Course>): Promise<void> {
    const ref = doc(db, "users", userId, "courses", courseId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
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
          id: d.id,
          ...(d.data() as Omit<Task, "id">),
        }));
        callback(tasks);
      },
      (error) => console.warn("Tasks listener error:", error)
    );
  }

  public static async addTask(userId: string, task: Omit<Task, "id">): Promise<string> {
    const ref = collection(db, "users", userId, "tasks");
    const docRef = await addDoc(ref, {
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  public static async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<void> {
    const ref = doc(db, "users", userId, "tasks", taskId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
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
          id: d.id,
          ...(d.data() as Omit<Category, "id">),
        }));
        callback(categories);
      },
      (error) => console.warn("Categories listener error:", error)
    );
  }

  public static async addCategory(userId: string, category: Omit<Category, "id">): Promise<string> {
    const ref = collection(db, "users", userId, "categories");
    const docRef = await addDoc(ref, {
      ...category,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  // --- TRANSACTIONS ---
  public static subscribeTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
    const ref = collection(db, "users", userId, "transactions");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: Transaction[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, "id">),
        }));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(list);
      },
      (error) => console.warn("Transactions listener error:", error)
    );
  }

  public static async addTransaction(userId: string, transaction: Omit<Transaction, "id">): Promise<string> {
    const ref = collection(db, "users", userId, "transactions");
    const docRef = await addDoc(ref, {
      ...transaction,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
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
    await setDoc(
      ref,
      {
        categoryId,
        monthlyLimit,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}
