import { z } from "zod";
import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { stdSuccess, stdError } from "@/lib/validation";
import { BudgetService } from "@/server/services/budget.service";
import { FioSkills } from "@/server/services/fio-skills.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  skill: z.enum(["can-i-spend", "plan-tasks", "simulate-saving"]),
  amount: z.number().optional(),
  categoryId: z.string().optional(),
  cutPct: z.number().min(1).max(100).optional(),
});

/** POST /api/ai/skills — skill deterministik berbasis data real user */
export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return stdError("BAD_REQUEST", "Skill tidak valid.", 400, parsed.error.issues);

    const db = requireAdminDb();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const [catSnap, trxSnap, budSnap, taskSnap, billSnap] = await Promise.all([
      db.collection("users").doc(uid).collection("categories").get(),
      db.collection("users").doc(uid).collection("transactions").orderBy("date", "desc").limit(200).get(),
      db.collection("users").doc(uid).collection("budgets").where("year", "==", year).where("month", "==", month).get(),
      db.collection("users").doc(uid).collection("tasks").orderBy("urgencyScore", "desc").limit(20).get(),
      db.collection("users").doc(uid).collection("recurring_bills").get(),
    ]);

    const categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Parameters<typeof BudgetService.calculateMonthlySummary>[0]["categories"];
    const transactions = trxSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Parameters<typeof BudgetService.calculateMonthlySummary>[0]["transactions"];
    const budgets = budSnap.docs.map((d) => ({ categoryId: String(d.data().categoryId), monthlyLimit: Number(d.data().monthlyLimit || 0) }));
    const tasks = taskSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Parameters<typeof FioSkills.planTasks>[0];
    const bills = billSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, number & string & boolean>) })) as { id: string; amount: number; dueDay: number; isActive: boolean }[];

    const summary = BudgetService.calculateMonthlySummary({ month, year, categories, transactions, budgets });
    const daily = BudgetService.calculateDailyAllowance({ summary, transactions, recurringBills: bills });

    const { skill, amount, categoryId, cutPct } = parsed.data;
    if (skill === "can-i-spend") {
      return stdSuccess(FioSkills.canISpend({ amount: Number(amount || 0), categoryId, summary, daily }));
    }
    if (skill === "plan-tasks") {
      return stdSuccess({ plans: FioSkills.planTasks(tasks) });
    }
    return stdSuccess({
      message: FioSkills.simulateSaving({
        cutCategoryId: String(categoryId), cutPct: Number(cutPct || 50),
        summary, dailyBurnRate: daily.dailyBurnRate,
      }),
    });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Skill gagal.", 500);
  }
}
