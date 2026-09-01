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
  totalLimit: number;
  totalSpent: number;
  remaining: number;
  overallPercentage: number;
  categories: Budget[];
}
