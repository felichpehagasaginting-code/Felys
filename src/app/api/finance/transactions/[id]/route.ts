import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { transactionSchema, stdSuccess, stdError } from "@/lib/validation";
import { budgetIdFor, monthYearFromDate, statusFromPct } from "@/server/services/finance-ledger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/finance/transactions/:id — reverse jurnal atomik */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const db = requireAdminDb();
    const { id } = await ctx.params;
    if (!id) return stdError("BAD_REQUEST", "ID transaksi wajib.", 400);

    const trxRef = db.collection("users").doc(uid).collection("transactions").doc(id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(trxRef);
      if (!snap.exists) throw new Error("Transaksi tidak ditemukan.");
      const t = snap.data() as { type: string; amount: number; categoryId: string; date: string; accountId?: string };
      if (t.type === "expense") {
        const { month, year } = monthYearFromDate(t.date);
        const budgetRef = db.collection("users").doc(uid).collection("budgets").doc(budgetIdFor(year, month, t.categoryId));
        const bSnap = await tx.get(budgetRef);
        if (bSnap.exists) {
          const prev = Number(bSnap.data()?.spentAmount || 0);
          const limit = Number(bSnap.data()?.monthlyLimit || 0);
          const next = Math.max(0, prev - Number(t.amount || 0));
          const pct = limit > 0 ? Math.round((next / limit) * 100) : 0;
          tx.set(budgetRef, { spentAmount: next, usedPercentage: pct, status: statusFromPct(pct), updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
      if (t.accountId) {
        const accRef = db.collection("users").doc(uid).collection("accounts").doc(t.accountId);
        const aSnap = await tx.get(accRef);
        if (aSnap.exists) {
          const before = Number(aSnap.data()?.currentBalance || 0);
          const reverse = t.type === "income" ? -Number(t.amount) : Number(t.amount);
          const after = Math.max(0, before + reverse);
          tx.update(accRef, { currentBalance: after, updatedAt: new Date().toISOString() });
          const ledgerRef = db.collection("users").doc(uid).collection("ledger_entries").doc();
          tx.set(ledgerRef, {
            accountId: t.accountId, transactionId: id, delta: reverse,
            balanceBefore: before, balanceAfter: after,
            reason: "transaction_delete", createdAt: new Date().toISOString(),
          });
        }
      }
      tx.delete(trxRef);
    });

    return stdSuccess({ id }, "Transaksi dihapus & saldo dikoreksi.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal menghapus transaksi.";
    return stdError("INTERNAL_ERROR", msg, 500);
  }
}

const partialSchema = transactionSchema.partial();

/**
 * PATCH /api/finance/transactions/:id — edit atomik via delta.
 * Boleh ubah: amount, categoryId(+denormalisasi), note, date.
 * TIDAK boleh ubah: type & accountId (ganti tipe/akun = hapus + catat baru).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const { id } = await ctx.params;
    if (!id) return stdError("BAD_REQUEST", "ID transaksi wajib.", 400);

    const body = await req.json();
    if (body?.type !== undefined || body?.accountId !== undefined) {
      return stdError("BAD_REQUEST", "Tipe dan akun tidak bisa diubah. Hapus lalu catat ulang.", 400);
    }
    const parsed = partialSchema.safeParse(body);
    if (!parsed.success) return stdError("BAD_REQUEST", "Data edit tidak valid.", 400, parsed.error.issues);
    const patch = parsed.data;
    if (patch.amount !== undefined) patch.amount = Number(patch.amount);
    if (patch.amount !== undefined && !(patch.amount > 0)) {
      return stdError("BAD_REQUEST", "Nominal harus lebih dari 0.", 400);
    }

    const db = requireAdminDb();
    const trxRef = db.collection("users").doc(uid).collection("transactions").doc(id);

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(trxRef);
      if (!snap.exists) throw new Error("Transaksi tidak ditemukan.");
      const old = snap.data() as {
        type: "expense" | "income"; amount: number; categoryId: string;
        categoryName?: string; categoryIcon?: string; categoryColor?: string;
        note?: string | null; date: string; accountId?: string;
      };

      const next = {
        amount: patch.amount ?? old.amount,
        categoryId: patch.categoryId ?? old.categoryId,
        categoryName: patch.categoryName ?? old.categoryName,
        categoryIcon: patch.categoryIcon ?? old.categoryIcon,
        categoryColor: patch.categoryColor ?? old.categoryColor,
        note: patch.note !== undefined ? patch.note : old.note,
        date: patch.date ? new Date(patch.date).toISOString() : old.date,
      };

      // 1. Koreksi bucket budget lama & baru (hanya expense yang teragregat)
      if (old.type === "expense") {
        const o = monthYearFromDate(old.date);
        const n = monthYearFromDate(next.date);
        const oldRef = db.collection("users").doc(uid).collection("budgets").doc(budgetIdFor(o.year, o.month, old.categoryId));
        const newRef = db.collection("users").doc(uid).collection("budgets").doc(budgetIdFor(n.year, n.month, next.categoryId));

        if (oldRef.path === newRef.path) {
          const bSnap = await tx.get(oldRef);
          if (bSnap.exists) {
            const prev = Number(bSnap.data()?.spentAmount || 0);
            const limit = Number(bSnap.data()?.monthlyLimit || 0);
            const nextSpent = Math.max(0, prev - old.amount + next.amount);
            const pct = limit > 0 ? Math.round((nextSpent / limit) * 100) : 0;
            tx.set(oldRef, { spentAmount: nextSpent, usedPercentage: pct, status: statusFromPct(pct), updatedAt: new Date().toISOString() }, { merge: true });
          }
        } else {
          const [boSnap, bnSnap] = await Promise.all([tx.get(oldRef), tx.get(newRef)]);
          if (boSnap.exists) {
            const prev = Number(boSnap.data()?.spentAmount || 0);
            const limit = Number(boSnap.data()?.monthlyLimit || 0);
            const v = Math.max(0, prev - old.amount);
            const pct = limit > 0 ? Math.round((v / limit) * 100) : 0;
            tx.set(oldRef, { spentAmount: v, usedPercentage: pct, status: statusFromPct(pct), updatedAt: new Date().toISOString() }, { merge: true });
          }
          if (bnSnap.exists) {
            const prev = Number(bnSnap.data()?.spentAmount || 0);
            const limit = Number(bnSnap.data()?.monthlyLimit || 0);
            const v = prev + next.amount;
            const pct = limit > 0 ? Math.round((v / limit) * 100) : 0;
            tx.set(newRef, {
              categoryId: next.categoryId, categoryName: next.categoryName || null,
              month: n.month, year: n.year, spentAmount: v, usedPercentage: pct,
              status: statusFromPct(pct), updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        }
      }

      // 2. Koreksi saldo akun via delta bertanda
      if (old.accountId) {
        const sign = old.type === "income" ? 1 : -1;
        const delta = sign * (next.amount - old.amount);
        if (delta !== 0) {
          const accRef = db.collection("users").doc(uid).collection("accounts").doc(old.accountId);
          const aSnap = await tx.get(accRef);
          if (aSnap.exists) {
            const before = Number(aSnap.data()?.currentBalance || 0);
            const after = Math.max(0, before + delta);
            tx.update(accRef, { currentBalance: after, updatedAt: new Date().toISOString() });
            tx.set(db.collection("users").doc(uid).collection("ledger_entries").doc(), {
              accountId: old.accountId, transactionId: id, delta,
              balanceBefore: before, balanceAfter: after,
              reason: "transaction_adjust", note: `Edit transaksi (${old.amount} → ${next.amount})`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      // 3. Update dokumen transaksi
      tx.set(trxRef, { ...next, updatedAt: new Date().toISOString() }, { merge: true });
      return { id, type: old.type, accountId: old.accountId || null, ...next };
    });

    return stdSuccess(updated, "Transaksi diperbarui.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Gagal memperbarui transaksi.";
    const code = msg === "Transaksi tidak ditemukan." ? 404 : 500;
    return stdError(code === 404 ? "NOT_FOUND" : "INTERNAL_ERROR", msg, code);
  }
}
