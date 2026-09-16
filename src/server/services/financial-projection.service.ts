/**
 * Financial Projection & Micro-Investing Simulation Engine
 * For university students: projects savings timelines, simulates compounding, and calculates round-up savings.
 */

export interface GoalTimeline {
  remainingAmount: number;
  daysNeeded: number;
  projectedDate: string; // ISO date string
  dailyRate: number;
}

export interface InvestmentComparison {
  name: string;
  annualRate: number;
  totalInvested: number;
  finalBalance: number;
  gain: number;
}

export class FinancialProjectionService {
  /**
   * Projects days and date to reach target savings amount based on daily saving rate.
   */
  public static calculateGoalTimeline(
    currentAmount: number,
    targetAmount: number,
    dailySavingsRate: number,
    now: Date = new Date()
  ): GoalTimeline {
    const remaining = Math.max(0, targetAmount - currentAmount);

    if (remaining === 0) {
      return {
        remainingAmount: 0,
        daysNeeded: 0,
        projectedDate: now.toISOString(),
        dailyRate: dailySavingsRate,
      };
    }

    const safeRate = Math.max(1000, dailySavingsRate);
    const daysNeeded = Math.ceil(remaining / safeRate);
    const projectedDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);

    return {
      remainingAmount: remaining,
      daysNeeded,
      projectedDate: projectedDate.toISOString(),
      dailyRate: safeRate,
    };
  }

  /**
   * Simulates how many days are saved by increasing daily savings by extraDailyAmount.
   */
  public static simulateDaysSaved(
    currentAmount: number,
    targetAmount: number,
    baseDailyRate: number,
    extraDailyAmount: number
  ): {
    originalDays: number;
    newDays: number;
    daysSaved: number;
  } {
    const remaining = Math.max(0, targetAmount - currentAmount);
    const originalRate = Math.max(1000, baseDailyRate);
    const newRate = originalRate + extraDailyAmount;

    const originalDays = Math.ceil(remaining / originalRate);
    const newDays = Math.ceil(remaining / newRate);
    const daysSaved = Math.max(0, originalDays - newDays);

    return {
      originalDays,
      newDays,
      daysSaved,
    };
  }

  /**
   * Compares 3 student investment scenarios over a given number of months.
   * 1. Tabungan Kas Biasa (0% return)
   * 2. Reksadana Pasar Uang (5.5% p.a.)
   * 3. Emas Digital (9% p.a.)
   */
  public static compareVehicles(
    monthlyContribution: number,
    months: number
  ): InvestmentComparison[] {
    const totalInvested = monthlyContribution * months;

    const vehicles = [
      { name: "Tabungan Rekening / Kas", annualRate: 0 },
      { name: "Reksadana Pasar Uang (RDPU)", annualRate: 0.055 },
      { name: "Emas Digital", annualRate: 0.09 },
    ];

    return vehicles.map((v) => {
      let balance = 0;
      const monthlyRate = v.annualRate / 12;

      for (let m = 0; m < months; m++) {
        balance = (balance + monthlyContribution) * (1 + monthlyRate);
      }

      const finalBalance = Math.round(balance);
      const gain = Math.max(0, finalBalance - totalInvested);

      return {
        name: v.name,
        annualRate: v.annualRate * 100,
        totalInvested,
        finalBalance,
        gain,
      };
    });
  }

  /**
   * Calculates virtual auto round-up accumulation (e.g. round up to nearest Rp 2.000 or Rp 5.000).
   */
  public static calculateRoundUpForecast(
    avgTransactionsPerMonth: number = 30,
    avgRoundUpPerTx: number = 2500
  ): {
    monthlySavings: number;
    in6Months: number;
    in1Year: number;
  } {
    const monthlySavings = avgTransactionsPerMonth * avgRoundUpPerTx;
    return {
      monthlySavings,
      in6Months: monthlySavings * 6,
      in1Year: monthlySavings * 12,
    };
  }
}
