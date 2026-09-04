import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { transferSchema, stdSuccess, stdError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/finance/accounts/transfer — atomik dua akun + 2 jurnal */
export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const body = await req.json();
    const parsed = transferSchema.safeParse({ ...body, amount: Number(body?.amount) });
    if (!parsed.success) return stdError("BAD_REQUEST", "Data transfer tidak valid.", 400, parsed.error.issues);
    const { fromId, toId, amount, note } = parsed.data;
    const db = requireAdminDb();

    const out = await db.runTransaction(async (tx) => {
      const fromRef = db.collection("users").doc(uid).collection("accounts").doc(fromId);
      const toRef = db.collection("users").doc(uid).collection("accounts").doc(toId);
      const [fs, ts] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
      if (!fs.exists || !ts.exists) throw new Error("Salah satu akun tidak ditemukan.");
      const fromBal = Number(fs.data()?.currentBalance || 0);
      if (fromBal < amount) throw new Error("Saldo akun asal tidak cukup.");
      const toBal = Number(ts.data()?.currentBalance || 0);
      const newFrom = fromBal - amount;
      const newTo = toBal + amount;
      tx.update(fromRef, { currentBalance: newFrom, updatedAt: new Date().toISOString() });
      tx.update(toRef, { currentBalance: newTo, updatedAt: new Date().toISOString() });
      const col = db.collection("users").doc(uid).collection("ledger_entries");
      tx.set(col.doc(), { accountId: fromId, delta: -amount, balanceBefore: fromBal, balanceAfter: newFrom, reason: "account_transfer_out", note: note || null, createdAt: new Date().toISOString() });
      tx.set(col.doc(), { accountId: toId, delta: amount, balanceBefore: toBal, balanceAfter: newTo, reason: "account_transfer_in", note: note || null, createdAt: new Date().toISOString() });
      return { fromId, toId, newFrom, newTo };
    });
    return stdSuccess(out, "Transfer antar akun berhasil.");
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal transfer.", 500);
  }
}
