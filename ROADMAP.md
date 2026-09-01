# ROADMAP.md — Felys Implementation & Sprint Plan

Dokumen ini adalah panduan eksekusi teknis bertahap (*actionable engineering roadmap*) untuk membangun **Felys** dari nol hingga siap rilis, dipecah ke dalam milestone sprint yang terstruktur.

---

## 1. Timeline & Milestone Overview

```
[Sprint 1] Foundation & Auth ──► [Sprint 2] Academic Mode ──► [Sprint 3] Finance Mode ──► [Sprint 4] AI Logic Engine ──► [Sprint 5] Polish & Launch
```

---

## 2. Rincian Sprint & Task Checklist

### 🏁 Sprint 1: Project Setup, Firebase & Design System Foundation
*Fokus: Menginisialisasi codebase Next.js 15, konfigurasi Firebase Admin & Client SDK, serta setup tema Dual-Mode.*

- [ ] **1.1 Inisialisasi Repositori:**
  - Setup Next.js 15 (App Router) + TypeScript + Tailwind CSS v4.
  - Setup ESLint, Prettier, dan import aliases (`@/*`).
- [ ] **1.2 Konfigurasi Firebase:**
  - Setup Firebase Project di Google Cloud Console.
  - Buat file inisialisasi `src/lib/firebase/client.ts` (Firebase JS SDK) dan `src/lib/firebase/admin.ts` (Firebase Admin SDK).
  - Deploy `firestore.rules` dan `firestore.indexes.json` awal.
- [ ] **1.3 Sistem Autentikasi:**
  - Form Login & Registrasi (Email/Password + Google Sign-In).
  - Endpoint `/api/auth/session` untuk pembuatan session cookie HTTP-only.
  - Middleware proteksi rute (`middleware.ts`).
- [ ] **1.4 Design System & Layout Shell:**
  - Setup CSS variables untuk warna dasar, Lavender Pop (`#B69CFF`), dan Mint Pop (`#7FE3C0`) di `globals.css`.
  - Buat komponen `ModeSwitcher` (Pill Toggle dengan slider animasi Framer Motion).
  - Buat `ModeThemeProvider` & Zustand store `use-mode-store.ts`.
  - Buat persistent layout (Navbar, Sidebar Desktop / Bottom Nav Mobile, & Drawer Container).

---

### 📚 Sprint 2: Academic Mode (Task & Course Management)
*Fokus: CRUD Mata Kuliah, CRUD Tugas, dan implementasi formula Urgency Score.*

- [ ] **2.1 Course Management:**
  - Subkoleksi Firestore `/users/{userId}/courses`.
  - Modal tambah & edit mata kuliah (pilihan warna pastel + SKS).
  - Chip filter mata kuliah di halaman tugas.
- [ ] **2.2 Task CRUD & List View:**
  - Subkoleksi Firestore `/users/{userId}/tasks`.
  - Task Card Component dengan indikator warna status urgensi (Coral, Peach, Mint).
  - Modal form input tugas (Judul, Mata Kuliah, Deadline picker, Prioritas, Estimasi Jam).
  - Pengelompokan list tugas: *Hari Ini*, *Minggu Ini*, *Nanti*, dan *Selesai*.
- [ ] **2.3 Urgency Engine Implementation:**
  - Buat `src/server/services/urgency.service.ts` berbasis formula di [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md#L9-L40).
  - Hitung `urgencyScore` secara real-time saat task di-create/update.
  - Fitur drag-and-drop manual order (override).
- [ ] **2.4 Sub-tasks / Checklist:**
  - Checklist item per tugas dengan progress bar visual.
  - Auto-check tugas induk saat semua sub-task selesai.

---

### 💰 Sprint 3: Finance Mode (Transactions & Budgets)
*Fokus: Input cepat transaksi numpad, manajemen kategori, visualisasi donut chart, dan budget progress bar.*

- [ ] **3.1 Kategori Default & Kustom:**
  - Seed 7 kategori bawaan (Makan, Transport, Hiburan, Kuliah, Belanja, Tagihan, Lainnya) saat user pertama login.
  - CRUD kategori kustom (nama, pemilihan ikon Lucide, dan flag esensial vs non-esensial).
- [ ] **3.2 Quick Transaction Entry (Zero Friction UX):**
  - Subkoleksi Firestore `/users/{userId}/transactions`.
  - Form input dengan Numpad besar untuk nominal + Grid ikon kategori 1-tap.
  - Transaksi Firestore atomik: catat transaksi dan akumulasi `spentAmount` di budget kategori.
- [ ] **3.3 Budgeting System:**
  - Subkoleksi Firestore `/users/{userId}/budgets/{year}_{month}_{categoryId}`.
  - Halaman kelola limit budget per kategori.
  - Progress bar dinamis 4 level: Aman (<70%), Perhatian (70-89%), Warning (90-99%), Overbudget (≥100%).
- [ ] **3.4 Laporan & Visualisasi:**
  - Donut Chart distribusi pengeluaran bulan ini (menggunakan palet pastel yang senada).
  - List riwayat transaksi dengan filter kategori & rentang tanggal.

---

### 🤖 Sprint 4: AI Logic, Cross-Mode Engine & Chat Assistant ("Fio")
*Fokus: Logika lintas mode, kartu insight rekomendasi, dan streaming AI Chat kontekstual.*

- [ ] **4.1 Task Recommendation Engine:**
  - Generate kartu "Top Urgent Tasks" di dashboard berdasarkan `urgencyScore` tertinggi.
- [ ] **4.2 Progressive Budget Alert Engine:**
  - Deteksi kategori yang melebihi threshold 70%/90%/100% dan berikan saran kategori non-esensial yang bisa ditekan.
- [ ] **4.3 Cross-Mode Insight Engine (Fitur Unggulan):**
  - Evaluator kondisi: $\ge 2$ deadline mendesak ($\le 7$ hari) + $\ge 1$ kategori non-esensial $\ge 70\%$.
  - Penyimpanan dan manajemen dismiss kartu di `/users/{userId}/ai_insights`.
  - Batasan frekuensi maksimal 1 insight cross-mode aktif per 24 jam.
- [ ] **4.4 AI Assistant Chat Drawer ("Fio"):**
  - Slide-in Drawer interaktif di pojok kanan bawah.
  - Assembly context data pengguna (Top Tasks + Ringkasan Budget aktif).
  - Integrasi Vercel AI SDK + Google Gemini API dengan response streaming persona "Fio" (santai, suportif, ringkas).

---

### ✨ Sprint 5: Unified Dashboard, Micro-interactions, QA & Launch Readiness
*Fokus: Polishing antarmuka, optimasi performa, aksesibilitas, dan deployment.*

- [ ] **5.1 Unified Dashboard Home:**
  - Tampilan ringkasan terpadu: Top 3-5 Tugas Urgent + Ringkasan Sisa Budget Bulan Ini + Banner Cross-Mode AI.
- [ ] **5.2 Micro-interactions & Visual Polish:**
  - Animasi transisi halus Lavender ↔ Mint saat switch mode.
  - Confetti saat menyelesaikan tugas / checklist.
  - Animasi count-up nominal uang di dashboard.
  - Ilustrasi & copy empty states ramah pengguna.
- [ ] **5.3 Aksesibilitas & Responsive Testing:**
  - Uji kontras warna teks di atas latar pastel (WCAG AA).
  - Navigasi keyboard penuh untuk modal input dan shortcut.
  - Uji tampilan mobile (Bottom navigation & Numpad touch-friendly).
- [ ] **5.4 Deployment & Production Setup:**
  - Konfigurasi Vercel Deployment & Environment Variables.
  - Setup Firestore TTL & Scheduled Cron trigger untuk pembaruan skor harian.

---

## 3. Matriks Referensi Spesifikasi

| Fitur / Modul | Dokumen Referensi |
| :--- | :--- |
| **Kebutuhan Produk & Scope** | [PRD.md](file:///f:/Projects/Felys/PRD.md) & [FEATURES.md](file:///f:/Projects/Felys/FEATURES.md) |
| **Arsitektur & Tech Stack** | [ARCHITECTURE.md](file:///f:/Projects/Felys/ARCHITECTURE.md) |
| **Database & Firestore Model** | [DATABASE-SCHEMA.md](file:///f:/Projects/Felys/DATABASE-SCHEMA.md) |
| **Kontrak Endpoint API** | [API-SPEC.md](file:///f:/Projects/Felys/API-SPEC.md) |
| **Formula & AI Engine** | [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md) |
| **Design System & Vibe** | [UI.md](file:///f:/Projects/Felys/UI.md) & [UX.md](file:///f:/Projects/Felys/UX.md) |
| **Tone of Voice & Persona** | [BRANDING.md](file:///f:/Projects/Felys/BRANDING.md) |
