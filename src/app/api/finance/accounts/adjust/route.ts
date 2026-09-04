import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { adjustBalanceSchema, stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/finance/accounts/adjust — wajib reason + jurnal ledger */
export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const body = await req.json();
    const parsed = adjustBalanceSchema.safeParse({ ...body, newBalance: Number(body?.newBalance) });
    if (!parsed.success) return stdError("BAD_REQUEST", "Data penyesuaian tidak valid.", 400, parsed.error.issues);
    const { accountId, newBalance, reason } = parsed.data;
    const db = requireAdminDb();
    const accRef = db.collection("users").doc(uid).collection("accounts").doc(accountId);

    const out = await db.runTransaction(async (tx) => {
      const snap = await tx.get(accRef);
      if (!snap.exists) throw new Error("Akun tidak ditemukan.");
      const before = Number(snap.data()?.currentBalance || 0);
      tx.update(accRef, { currentBalance: newBalance, updatedAt: new Date().toISOString() });
      const ledgerRef = db.collection("users").doc(uid).collection("ledger_entries").doc();
      tx.set(ledgerRef, {
        accountId, transactionId: null, delta: newBalance - before,
        balanceBefore: before, balanceAfter: newBalance,
        reason: "account_adjust", note: reason, createdAt: new Date().toISOString(),
      });
      return { accountId, balanceBefore: before, balanceAfter: newBalance };
    });
    return stdSuccess(out, "Saldo disesuaikan & tercatat di jurnal.");
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal adjust saldo.", 500);
  }
}
