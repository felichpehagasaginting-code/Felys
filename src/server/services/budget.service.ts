import { BudgetStatus, MonthlyBudgetSummary, Budget, Category, Transaction } from "@/types/finance";

/**
 * AI-LOGIC.md Section 3 implementation: Finance Budget Logic Engine
 */
export class BudgetService {
  /**
   * Hitung level status budget dari used percentage
   */
  public static getBudgetStatus(usedPercentage: number): BudgetStatus {
    if (usedPercentage >= 100) return "overbudget";
    if (usedPercentage >= 90) return "warning";
    if (usedPercentage >= 70) return "attention";
    return "safe";
  }

  /**
   * Agregasi transaksi dan hitung sisa budget per kategori
   */
  public static calculateMonthlySummary(params: {
    month: number;
    year: number;
    categories: Category[];
    transactions: Transaction[];
    budgets: { categoryId: string; monthlyLimit: number }[];
  }): MonthlyBudgetSummary {
    const { month, year, categories, transactions, budgets } = params;

    // Filter transaksi pengeluaran bulan dan tahun ini
    const currentMonthExpenses = transactions.filter((trx) => {
      if (trx.type !== "expense") return false;
      const date = new Date(trx.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    let totalLimit = 0;
    let totalSpent = 0;

    // Filter kategori pengeluaran saja untuk kalkulasi budget limit
    const expenseCategories = categories.filter(
      (c) => c.type === "expense" || (!c.type && c.isDefault)
    );

    const budgetList: Budget[] = expenseCategories.map((cat) => {
      const budgetConfig = budgets.find((b) => b.categoryId === cat.id);
      const monthlyLimit = budgetConfig?.monthlyLimit || 0;

      const spentAmount = currentMonthExpenses
        .filter((t) => t.categoryId === cat.id || t.categoryName === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);

      const remainingAmount = Math.max(0, monthlyLimit - spentAmount);
      const usedPercentage = monthlyLimit > 0 ? Math.round((spentAmount / monthlyLimit) * 100) : 0;
      const status = this.getBudgetStatus(usedPercentage);

      totalLimit += monthlyLimit;
      totalSpent += spentAmount;

      return {
        id: `${year}_${month}_${cat.id}`,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        isEssential: cat.isEssential,
        monthlyLimit,
        month,
        year,
        spentAmount,
        remainingAmount,
        usedPercentage,
        status,
      };
    });

    const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const remaining = Math.max(0, totalLimit - totalSpent);

    return {
      month,
      year,
      totalLimit,
      totalSpent,
      remaining,
      overallPercentage,
      categories: budgetList,
    };
  }

  /**
   * Temukan kategori non-esensial dengan pengeluaran terbesar untuk disarankan dikurangi
   */
  public static findCandidateCategoriesToReduce(budgets: Budget[]): Budget | null {
    const nonEssentialOverloaded = budgets
      .filter((b) => !b.isEssential && b.usedPercentage >= 70 && b.spentAmount > 0)
      .sort((a, b) => b.spentAmount - a.spentAmount);

    return nonEssentialOverloaded.length > 0 ? nonEssentialOverloaded[0] : null;
  }
}
