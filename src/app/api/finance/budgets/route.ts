import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { budgetLimitSchema, stdSuccess, stdError } from "@/lib/validation";
import { budgetIdFor, statusFromPct } from "@/server/services/finance-ledger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/finance/budgets?month&year — ringkasan server-side dengan ID {year}_{month}_{cat} */
export async function GET(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const url = new URL(req.url);
    const now = new Date();
    const month = Number(url.searchParams.get("month") || now.getMonth() + 1);
    const year = Number(url.searchParams.get("year") || now.getFullYear());
    const db = requireAdminDb();

    const [budSnap, catSnap, trxSnap] = await Promise.all([
      db.collection("users").doc(uid).collection("budgets")
        .where("year", "==", year).where("month", "==", month).get(),
      db.collection("users").doc(uid).collection("categories").get(),
      db.collection("users").doc(uid).collection("transactions").get(),
    ]);

    const limits = new Map<string, number>();
    budSnap.docs.forEach((d) => {
      const v = d.data();
      if (v.categoryId) limits.set(String(v.categoryId), Number(v.monthlyLimit || 0));
    });

    const spent = new Map<string, number>();
    let totalSpent = 0;
    let totalIncome = 0;
    trxSnap.docs.forEach((d) => {
      const t = d.data() as { type: string; amount: number; categoryId: string; date: string };
      const dt = new Date(t.date);
      if (dt.getMonth() + 1 !== month || dt.getFullYear() !== year) return;
      if (t.type === "expense") {
        totalSpent += Number(t.amount || 0);
        spent.set(t.categoryId, (spent.get(t.categoryId) || 0) + Number(t.amount || 0));
      } else if (t.type === "income") {
        totalIncome += Number(t.amount || 0);
      }
    });

    const categories = catSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter((c) => (c as { type?: string }).type !== "income") as {
        id: string; name: string; icon: string; color: string; isEssential: boolean;
      }[];

    let totalLimit = 0;
    const list = categories.map((c) => {
      const monthlyLimit = limits.get(c.id) || 0;
      const spentAmount = spent.get(c.id) || 0;
      const usedPercentage = monthlyLimit > 0 ? Math.round((spentAmount / monthlyLimit) * 100) : 0;
      totalLimit += monthlyLimit;
      return {
        budgetId: budgetIdFor(year, month, c.id),
        categoryId: c.id, categoryName: c.name, categoryIcon: c.icon, categoryColor: c.color,
        isEssential: c.isEssential, monthlyLimit, month, year,
        spentAmount, remainingAmount: monthlyLimit - spentAmount,
        usedPercentage, status: statusFromPct(usedPercentage),
      };
    });

    const remaining = totalLimit > 0 ? totalLimit - totalSpent : totalIncome - totalSpent;
    return stdSuccess({
      totalBudget: totalLimit, totalSpent, totalIncome,
      remaining, netSavings: totalIncome - totalSpent, categories: list,
    });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal memuat budget.", 500);
  }
}

/** PUT /api/finance/budgets — set limit dengan ID {year}_{month}_{categoryId} */
export async function PUT(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const body = await req.json();
    const parsed = budgetLimitSchema.safeParse({
      ...body,
      monthlyLimit: Number(body?.monthlyLimit),
      month: Number(body?.month),
      year: Number(body?.year),
    });
    if (!parsed.success) return stdError("BAD_REQUEST", "Data budget tidak valid.", 400, parsed.error.issues);
    const { categoryId, monthlyLimit, month, year } = parsed.data;
    const db = requireAdminDb();
    const ref = db.collection("users").doc(uid).collection("budgets").doc(budgetIdFor(year, month, categoryId));

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const prevSpent = snap.exists ? Number(snap.data()?.spentAmount || 0) : 0;
      const pct = monthlyLimit > 0 ? Math.round((prevSpent / monthlyLimit) * 100) : 0;
      tx.set(ref, {
        categoryId, monthlyLimit, month, year, spentAmount: prevSpent,
        usedPercentage: pct, status: statusFromPct(pct),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    return stdSuccess({ budgetId: budgetIdFor(year, month, categoryId), monthlyLimit });
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal menyimpan budget.", 500);
  }
}
