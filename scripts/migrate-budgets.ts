/**
 * Migrasi satu kali: budgets/{categoryId} lama -> budgets/{year}_{month}_{categoryId}.
 * Jalankan: npx tsx scripts/migrate-budgets.ts <uid?> (atau semua user bila tanpa argumen).
 * Idempotent: skip bila dokumen target sudah ada.
 */
import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  } else {
    admin.initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "felys-app" });
  }
}

async function main() {
  const db = admin.firestore();
  const onlyUid = process.argv[2];
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const users = onlyUid ? [{ id: onlyUid }] : (await db.collection("users").select().get()).docs;
  let migrated = 0;
  for (const u of users) {
    const uid = u.id;
    const snap = await db.collection("users").doc(uid).collection("budgets").get();
    for (const d of snap.docs) {
      if (d.id.includes("_")) continue; // sudah format baru
      const v = d.data();
      if (!v.categoryId) continue;
      const newId = `${year}_${month}_${v.categoryId}`;
      const target = db.collection("users").doc(uid).collection("budgets").doc(newId);
      const exists = await target.get();
      if (!exists.exists) {
        await target.set({
          categoryId: v.categoryId,
          monthlyLimit: Number(v.monthlyLimit || 0),
          month, year,
          spentAmount: Number(v.spentAmount || 0),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        migrated++;
      }
    }
  }
  console.log(`Migrasi selesai. Dokumen dimigrasi: ${migrated}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
