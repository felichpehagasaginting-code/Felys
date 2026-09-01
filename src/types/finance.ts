export type TransactionType = "expense" | "income";
export type BudgetStatus = "safe" | "attention" | "warning" | "overbudget";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isEssential: boolean;
  type?: "expense" | "income" | "both";
  isDefault?: boolean;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  note?: string | null;
  date: string; // ISO string
  createdAt: string;
}

export interface Budget {
  id: string; // {year}_{month}_{categoryId}
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  isEssential?: boolean;
  monthlyLimit: number;
  month: number;
  year: number;
  spentAmount: number;
  remainingAmount: number;
  usedPercentage: number;
  status: BudgetStatus;
  updatedAt?: string;
}

export interface MonthlyBudgetSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalSpent: number;
  totalLimit: number;
  netSavings: number; // Saldo Riil: totalIncome - totalSpent
  remaining: number; // Sisa Anggaran: Menyesuaikan limit dan pemasukan
  effectiveBudgetBase: number; // Basis anggaran acuan (Limit atau Total Pemasukan)
  overallPercentage: number;
  isDeficit: boolean; // Menandakan apakah pengeluaran melebihi limit atau pemasukan
  categories: Budget[];
}

export interface RecurringBill {
  id: string;
  name: string; // e.g. "Uang Kos Bulanan", "UKT Semester 4", "WiFi Kos", "Spotify Premium"
  amount: number;
  categoryId: string;
  categoryName?: string;
  frequency: "monthly" | "semester" | "yearly";
  dueDay: number; // 1-31 (Day of month)
  lastPaidDate?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface FriendDebt {
  id: string;
  friendName: string;
  friendPhone?: string;
  amount: number;
  description: string;
  type: "they_owe_me" | "i_owe_them"; // Piutang (Teman hutang ke saya) / Hutang (Saya hutang ke teman)
  isSettled: boolean;
  settledDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export interface DailyAllowanceSummary {
  dailyAllowance: number;
  todaySpent: number;
  todayRemaining: number;
  remainingDays: number;
  upcomingBillsAmount: number;
  isOverDailyLimit: boolean;
  dailyBurnRate: number;
  projectedBurnDate: string | null; // e.g. "19 September"
  isCriticalBurn: boolean;
}

