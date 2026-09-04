# SPEC-V2.md — Felys Realita Implementasi (Sinkronisasi Dokumen)

Dokumen lama (`PRD/FEATURES/ARCHITECTURE/ROADMAP`) bicara MVP. Realita `src/` sudah jauh lebih maju.
File ini jadi acuan tunggal yang sinkron dengan kode per 4 Sep 2026.

## 1. Fitur yang SUDAH live di kode (di luar dokumen MVP)
- Akademik: Pomodoro, Weekly Timetable, D-Day Countdown, Share Task, Live Class Status, PDF Lecture Reader (unpdf), subtasks + progress.
- Finance: 19 kategori default (11 expense + 8 income), Multi-Account (GoPay/Superbank/SeaBank/dll), Transfer antar akun, Adjust Balance + **ledger_entries audit**, Savings Goal, Recurring Bills, Emergency Fund, Split Bill + Debts, Receipt Scan OCR (tesseract.js), Daily Allowance + Burn-rate projection, Export PDF (jspdf).
- AI: Chat Fio (Gemini 2.5/2.0/1.5 fallback), Task Breakdown, InsightCard, **Skills deterministik** (`/api/ai/skills`: can-i-spend, plan-tasks, simulate-saving).
- Platform: PWA manifest, Capacitor config (PWA-first direkomendasikan), Dynamic Island iOS safe-area, BottomNav mobile, sound+haptic design.

## 2. Kontrak data final (menggantikan bagian usang DATABASE-SCHEMA.md)
- `budgets/{year}_{month}_{categoryId}` (bukan `{categoryId}` saja). Lihat `src/app/api/finance/budgets/route.ts`.
- Baru: `ledger_entries/{id}` immutable `{accountId, delta, balanceBefore/After, reason, transactionId?}`.
- Baru: `ai_usage/{yyyy-mm-dd}` counter `{chatUsed, pdfUsed}` (server-only write).
- Transaksi & transfer uang WAJIB lewat API atomik:
  - `POST /api/finance/transactions`, `DELETE /api/finance/transactions/:id`
  - `POST /api/finance/accounts/adjust` (wajib `reason`), `POST /api/finance/accounts/transfer`
  - `PUT/GET /api/finance/budgets`, `GET/POST /api/academic/tasks`
  - `POST /api/ai/skills`, `GET /api/cron/*` (diamankan `CRON_SECRET`)

## 3. Threshold AI final (menggantikan angka menyimpang di kode lama)
- Cross-mode: **>=2 task urgency>=80 deadline<=7 hari** + **>=1 non-esensial >=70%** (`insight.service.ts`).
- Budget: safe <70, attention 70-89, warning 90-99, overbudget >=100.
- Urgency: W1=0.5 deadline, W2=0.3 prioritas, W3=0.2 effort; recalc harian via `/api/cron/recalculate-urgency`.

## 4. Keputusan arsitektur P1–P10 (ringkas)
P1 atomik + ledger | P2 no-hardcode keys + session verify + rules ketat | P3 budget bulanan + clone tanggal 1 |
P4 kuota Firestore + truncate PDF 8k | P5 urgency server-side | P6 query limit 100 + index baru |
P7 vitest 11 tests + CI | P8 Fio skills | P9 cron reminders + vercel.json + PWA-first |
P10 dynamic import berat + Firestore source-of-truth (push lokal hanya bila remote kosong).

## 5. Yang masih harus dilakukan manual (di luar kode)
1. Rotasi Firebase web API key yang sempat ter-hardcode di `client.ts` (versi lama).
2. Isi env: `CRON_SECRET`, `GEMINI_API_KEY`, `FIREBASE_*`, deploy `firestore.rules` + `firestore.indexes.json`.
3. Jalankan `npx tsx scripts/migrate-budgets.ts` sekali untuk budget lama.
4. Aktifkan Vercel Cron (vercel.json sudah siap) + FCM server key untuk push nyata.
5. Keputusan store: PWA-first (disarankan) atau lanjutkan Capacitor export (`output: export`).
