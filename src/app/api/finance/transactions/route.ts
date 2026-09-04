import { FieldValue } from "firebase-admin/firestore";
import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { transactionSchema, stdSuccess, stdError } from "@/lib/validation";
import { budgetIdFor, monthYearFromDate, statusFromPct } from "@/server/services/finance-ledger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/finance/transactions — atomic: transaction + budget spent + account balance + ledger */
export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const db = requireAdminDb();

    const body = await req.json();
    const parsed = transactionSchema.safeParse({
      ...body,
      amount: Number(body?.amount),
    });
    if (!parsed.success) {
      return stdError("BAD_REQUEST", "Data transaksi tidak valid.", 400, parsed.error.issues);
    }
    const t = parsed.data;
    const { month, year } = monthYearFromDate(t.date);
    const budgetId = budgetIdFor(year, month, t.categoryId);

    const trxRef = db.collection("users").doc(uid).collection("transactions").doc();
    const budgetRef = db.collection("users").doc(uid).collection("budgets").doc(budgetId);
    const ledgerRef = db.collection("users").doc(uid).collection("ledger_entries").doc();
    const accountRef = t.accountId
      ? db.collection("users").doc(uid).collection("accounts").doc(t.accountId)
      : null;

    const result = await db.runTransaction(async (tx) => {
      const budgetSnap = await tx.get(budgetRef);
      const prevSpent = Number(budgetSnap.exists ? budgetSnap.data()?.spentAmount || 0 : 0);
      const monthlyLimit = Number(budgetSnap.exists ? budgetSnap.data()?.monthlyLimit || 0 : 0);

      let balanceBefore: number | null = null;
      let balanceAfter: number | null = null;
      if (accountRef) {
        const accSnap = await tx.get(accountRef);
        if (!accSnap.exists) throw new Error("Akun tidak ditemukan.");
        balanceBefore = Number(accSnap.data()?.currentBalance || 0);
        const delta = t.type === "income" ? t.amount : -t.amount;
        balanceAfter = Math.max(0, balanceBefore + delta);
      }

      const isExpense = t.type === "expense";
      const newSpent = isExpense ? prevSpent + t.amount : prevSpent;
      const usedPct = monthlyLimit > 0 ? Math.round((newSpent / monthlyLimit) * 100) : 0;

      const trxData = {
        ...t,
        date: new Date(t.date).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      tx.set(trxRef, trxData);

      if (isExpense) {
        tx.set(
          budgetRef,
          {
            categoryId: t.categoryId,
            categoryName: t.categoryName || null,
            monthlyLimit,
            month,
            year,
            spentAmount: newSpent,
            usedPercentage: usedPct,
            status: statusFromPct(usedPct),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      if (accountRef && balanceBefore !== null && balanceAfter !== null) {
        tx.update(accountRef, {
          currentBalance: balanceAfter,
          updatedAt: new Date().toISOString(),
        });
        tx.set(ledgerRef, {
          accountId: t.accountId,
          transactionId: trxRef.id,
          delta: t.type === "income" ? t.amount : -t.amount,
          balanceBefore,
          balanceAfter,
          reason: "transaction_create",
          note: t.note || null,
          createdAt: new Date().toISOString(),
        });
      }

      return { id: trxRef.id, ...trxData, balanceAfter };
    });

    return stdSuccess(result, "Transaksi tercatat.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal mencatat transaksi.";
    return stdError("INTERNAL_ERROR", msg, 500);
  }
}

/** GET /api/finance/transactions?month&year&type&categoryId&limit — paginated server-side */
export async function GET(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const db = requireAdminDb();
    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));

    let q: FirebaseFirestore.Query = db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .orderBy("date", "desc")
      .limit(limit);
    const type = url.searchParams.get("type");
    const categoryId = url.searchParams.get("categoryId");
    if (type === "expense" || type === "income") q = q.where("type", "==", type);
    if (categoryId) q = q.where("categoryId", "==", categoryId);

    const snap = await q.get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return stdSuccess(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal memuat transaksi.";
    return stdError("INTERNAL_ERROR", msg, 500);
  }
}
