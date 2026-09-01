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
   * Agregasi transaksi dan hitung sisa budget per kategori serta cashflow riil
   */
  public static calculateMonthlySummary(params: {
    month: number;
    year: number;
    categories: Category[];
    transactions: Transaction[];
    budgets: { categoryId: string; monthlyLimit: number }[];
  }): MonthlyBudgetSummary {
    const { month, year, categories, transactions, budgets } = params;

    // Filter transaksi bulan dan tahun ini
    const currentMonthTransactions = transactions.filter((trx) => {
      const date = new Date(trx.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const currentMonthExpenses = currentMonthTransactions.filter((t) => t.type === "expense");
    const currentMonthIncomes = currentMonthTransactions.filter((t) => t.type === "income");

    const totalSpent = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = currentMonthIncomes.reduce((sum, t) => sum + t.amount, 0);

    let totalLimit = 0;

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

      const remainingAmount = monthlyLimit > 0 ? monthlyLimit - spentAmount : 0;
      const usedPercentage = monthlyLimit > 0 ? Math.round((spentAmount / monthlyLimit) * 100) : 0;
      const status = this.getBudgetStatus(usedPercentage);

      totalLimit += monthlyLimit;

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

    // Saldo Dompet Riil (Pemasukan - Pengeluaran)
    const netSavings = totalIncome - totalSpent;

    // Basis Anggaran Acuan: Prioritaskan Total Limit (jika disetel), atau Total Pemasukan
    const effectiveBudgetBase = totalLimit > 0 ? totalLimit : totalIncome;

    // Sisa Anggaran Cerdas:
    // 1. Jika pengguna mengatur Limit Anggaran: totalLimit - totalSpent
    // 2. Jika pengguna belum mengatur Limit tapi ada Pemasukan: totalIncome - totalSpent
    // 3. Jika belum ada keduanya tapi ada Pengeluaran: -totalSpent (defisit)
    let remaining = 0;
    if (totalLimit > 0) {
      remaining = totalLimit - totalSpent;
    } else if (totalIncome > 0) {
      remaining = totalIncome - totalSpent;
    } else {
      remaining = -totalSpent;
    }

    const overallPercentage =
      effectiveBudgetBase > 0
        ? Math.round((totalSpent / effectiveBudgetBase) * 100)
        : totalSpent > 0
        ? 100
        : 0;

    const isDeficit = remaining < 0 || netSavings < 0;

    return {
      month,
      year,
      totalIncome,
      totalSpent,
      totalLimit,
      netSavings,
      remaining,
      effectiveBudgetBase,
      overallPercentage,
      isDeficit,
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

  /**
   * Hitung batas belanja harian aman (Safe-to-Spend Daily Allowance) & Proyeksi Dompet Kering
   */
  public static calculateDailyAllowance(params: {
    summary: MonthlyBudgetSummary;
    transactions: Transaction[];
    recurringBills: { id: string; amount: number; dueDay: number; isActive: boolean }[];
  }) {
    const { summary, transactions, recurringBills } = params;

    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

    // Tagihan rutin mendatang yang belum jatuh tempo di sisa bulan ini
    const upcomingBillsAmount = recurringBills
      .filter((b) => b.isActive && b.dueDay >= currentDay)
      .reduce((sum, b) => sum + b.amount, 0);

    // Dana aman tersedia untuk belanja harian
    const availableFund = Math.max(0, summary.netSavings - upcomingBillsAmount);
    const dailyAllowance = Math.round(availableFund / remainingDays);

    // Pengeluaran khusus hari ini
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const todaySpent = transactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date);
        return (
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const todayRemaining = dailyAllowance - todaySpent;
    const isOverDailyLimit = todayRemaining < 0;

    // Hitung Laju Pengeluaran Harian (Burn Rate)
    const passedDays = Math.max(1, currentDay);
    const dailyBurnRate = Math.round(summary.totalSpent / passedDays);

    let projectedBurnDate: string | null = null;
    let isCriticalBurn = false;

    if (dailyBurnRate > 0 && summary.netSavings > 0) {
      const daysLeftBeforeEmpty = Math.floor(summary.netSavings / dailyBurnRate);
      if (daysLeftBeforeEmpty < remainingDays) {
        const exhaustionDate = new Date();
        exhaustionDate.setDate(currentDay + daysLeftBeforeEmpty);
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        projectedBurnDate = `${exhaustionDate.getDate()} ${monthNames[exhaustionDate.getMonth()]}`;
        isCriticalBurn = daysLeftBeforeEmpty <= 7;
      }
    }

    return {
      dailyAllowance,
      todaySpent,
      todayRemaining,
      remainingDays,
      upcomingBillsAmount,
      isOverDailyLimit,
      dailyBurnRate,
      projectedBurnDate,
      isCriticalBurn,
    };
  }
}

