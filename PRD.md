# PRD.md — Felys Product Requirements Document

## 1. Executive Summary

- **Nama Produk:** Felys (AI Persona: "Fio")
- **Tagline:** *"Atur waktu, atur uang, tenang aja."* / *"Satu ruang buat tugas dan dompet kamu."*
- **Kategori:** Dual-mode Productivity & Personal Finance Web/Mobile Application powered by Contextual AI.
- **Problem Statement:** 
  Mahasiswa aktif menghadapi beban ganda: manajemen tugas kuliah yang padat dan pengelolaan keuangan mandiri (uang saku/kos). Saat ini mereka terpaksa menggunakan aplikasi terpisah (Notion/Todoist untuk tugas, Money Lover/Catatan Keuangan untuk uang) yang tidak saling terhubung, kaku, dan membebani secara kognitif (*app fatigue*).
- **Solution:** 
  Felys menyatukan manajemen tugas akademik dan pencatatan finansial dalam satu aplikasi *dual-mode* yang mulus, dilengkapi asisten AI terintegrasi yang mampu memberikan *cross-mode insight* (menghubungkan beban tugas dengan kondisi anggaran).

---

## 2. Target Audience & User Persona

### 2.1 Demografi
- **Usia:** 18 – 24 tahun (Mahasiswa D3/S1).
- **Karakteristik:** Tinggal di kos/mandiri, menerima uang saku bulanan/mingguan, memiliki 5–8 mata kuliah aktif per semester.
- **Kebiasaan Digital:** Akrab dengan aplikasi modern berdesain bersih (Notion, Duolingo, Cash App, Spotify), mengutamakan kecepatan input dan visual yang menarik (*aesthetic*).

### 2.2 User Persona: "Rian — Mahasiswa Tingkat 2"
- **Pain Points:**
  - Sering lupa deadline tugas karena catatan tersebar di grup WhatsApp dan LMS kampus.
  - Sering *overbudget* di pertengahan bulan karena tidak sadar sering nongkrong/jajan saat tugas sedang menumpuk (*stress buying*).
  - Malas mencatat keuangan jika form input terlalu panjang dan rumit.
- **Needs:**
  - Tahu apa yang harus dikerjakan hari ini dalam waktu < 3 detik setelah membuka aplikasi.
  - Input transaksi super cepat (numpad besar + kategori instan).
  - Pengingat yang suportif dan cerdas, bukan notifikasi kaku bernada menghakimi.

---

## 3. Product Goals & Success Metrics (KPI)

| Kategori | Metrik Keberhasilan (Target MVP) |
| :--- | :--- |
| **Activation** | ≥ 70% pengguna baru menyelesaikan *onboarding* (membuat ≥1 mata kuliah & ≥1 budget kategori). |
| **Engagement** | Rata-rata pencatatan ≥ 3 transaksi/minggu dan ≥ 4 interaksi tugas/minggu per active user. |
| **Speed to Value** | Waktu dari buka app hingga melihat tugas paling urgent < 3 detik (*Zero Friction*). |
| **AI Utility** | ≥ 40% pengguna mengklik/mengambil tindakan dari *AI Insight Card* yang ditampilkan. |
| **Retention** | W2 Retention ≥ 45% (pengguna kembali di minggu kedua). |

---

## 4. Feature Specification & Requirements

### 4.1 Mode Akademik (Task Management)

#### FR-ACAD-01: Course Management (Mata Kuliah)
- Pengguna dapat membuat, mengedit, dan menghapus mata kuliah.
- Field: `name`, `color` (tagging visual), `sks` (opsional, bobot prioritas).
- Filter daftar tugas berdasarkan mata kuliah.

#### FR-ACAD-02: Task CRUD & Management
- Pengguna dapat membuat, melihat, mengedit, dan menghapus tugas.
- Field: `title`, `courseId`, `deadline`, `priority` (low/medium/high), `estimatedHours`, `description`, `status` (todo/in_progress/done).
- Visual status badge berdasarkan level urgensi AI (Coral untuk urgent, Peach untuk warning, Mint untuk aman).

#### FR-ACAD-03: Sub-tasks / Checklist (Fase 2)
- Setiap tugas mendukung daftar sub-task bertingkat (`title`, `isDone`).
- Auto-progress bar pada card tugas berdasarkan rasio sub-task yang selesai.

#### FR-ACAD-04: Views & Organization
- **List View:** Pengelompokan tugas berdasarkan *Hari Ini*, *Minggu Ini*, *Nanti*, dan *Selesai*.
- **Calendar View (Fase 2):** Tampilan kalender bulanan dengan indikator *deadline badge*.

#### FR-ACAD-05: Urgency Sorting Engine
- Sistem otomatis menghitung `urgencyScore` (0-100) berbasis formula waktu, prioritas, dan estimasi beban kerja (detail di [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md)).
- Mendukung *manual drag & drop reorder* (override).

---

### 4.2 Mode Finance (Personal Finance Tracker)

#### FR-FIN-01: Transaction CRUD
- Input pengeluaran (*expense*) dan pemasukan (*income*) super cepat (Numpad input + Category Grid).
- Field: `type`, `amount`, `categoryId`, `note`, `date`.

#### FR-FIN-02: Category Management
- Default kategori terpasang otomatis: *Makan, Transport, Hiburan, Kebutuhan Kuliah, Belanja, Tagihan, Lainnya*.
- Pengguna dapat menambahkan kategori kustom dengan pemilihan warna dan ikon.

#### FR-FIN-03: Budgeting System
- Pengguna dapat menetapkan limit anggaran bulanan per kategori.
- Progress bar konsumsi budget real-time dengan status warna progresif:
  - `< 70%`: Aman (Mint)
  - `70% - 89%`: Perhatian (Peach)
  - `90% - 99%`: Warning
  - `≥ 100%`: Overbudget (Coral)
- Otomatis berganti periode tiap awal bulan baru.

#### FR-FIN-04: Visualisasi & Laporan
- **Donut Chart:** Distribusi pengeluaran per kategori bulan berjalan.
- **Line Chart (Fase 2):** Tren pengeluaran harian/mingguan.
- Filter riwayat transaksi berdasarkan rentang tanggal, kategori, dan jenis transaksi.

---

### 4.3 AI Assistant & Cross-Mode Engine ("Fio")

#### FR-AI-01: Task Recommendation Card
- Menampilkan Top 3-5 tugas paling mendesak di dashboard dengan ringkasan alasan cerdas dan CTA *"Mulai kerjain"*.

#### FR-AI-02: Progressive Budget Alert
- Memberikan peringatan saat kategori mencapai threshold 70%, 90%, dan 100%+ serta merekomendasikan kategori non-esensial yang bisa ditekan.

#### FR-AI-03: Cross-Mode Insight Engine (Unique Value Proposition)
- Otomatis memicu insight terpadu jika terdapat kondisi: **≥2 deadline mendesak dalam 7 hari** BERSAMAAN DENGAN **≥1 kategori non-esensial mencapai ≥70% budget**.
- Format output suportif dan actionable (Contoh: *"Minggu ini ada 3 deadline mepet. Coba rem jajan dulu biar energi & budget tetap aman."*).
- Dibatasi maksimal 1 kartu per hari dan dapat di-dismiss.

#### FR-AI-04: AI Chat Drawer (Fase 2)
- Interaksi tanya-jawab kontekstual dengan persona "Fio" menggunakan context injection data tugas aktif & sisa budget user.

---

### 4.4 Cross-Cutting & System Features

- **FR-SYS-01 (Dual-Mode Switcher):** Persistent toggle di navbar dengan transisi animasi halus antar tema (Lavender ↔ Mint). Status mode terakhir tersimpan per sesi user.
- **FR-SYS-02 (Authentication):** Email & Password authentication + Social Login (Google OAuth).
- **FR-SYS-03 (Unified Dashboard Home):** Layar utama menampilkan ringkasan Top Urgent Task + Ringkasan Sisa Budget Bulan Ini + 1 Kartu Insight AI.
- **FR-SYS-04 (Settings & Customization):** Pengaturan profil, preferensi notifikasi, manajemen master data mata kuliah & kategori, serta dukungan Light/Dark mode.

---

## 5. Prioritas Rilis & Scope Breakdown

```
+-----------------------------------------------------------------------------------+
| MVP (Phase 1) - Core Experience                                                  |
+-----------------------------------------------------------------------------------+
| - Auth (Email & Google OAuth)                                                     |
| - Dual-Mode Navbar Switcher (Lavender / Mint)                                     |
| - Academic Mode: CRUD Mata Kuliah, CRUD Tugas (List View), Urgency Score Formula  |
| - Finance Mode: CRUD Kategori, Input Transaksi Cepat, Budget Limit per Kategori   |
| - Basic AI: Top Urgent Tasks Card, Basic Budget Alerts (70%/90%/100%)             |
| - Unified Dashboard Ringkas                                                       |
+-----------------------------------------------------------------------------------+
                                      │
                                      ▼
+-----------------------------------------------------------------------------------+
| Phase 2 - Advanced & Differentiation                                              |
+-----------------------------------------------------------------------------------+
| - Cross-Mode AI Insight Engine (Kombinasi Task + Budget)                          |
| - AI Assistant Chat Panel (Fio Streaming LLM Contextual)                          |
| - Sub-tasks & Checklist Progress                                                  |
| - Calendar View (Mode Akademik)                                                   |
| - Advanced Financial Visualizations (Donut & Trend Line Chart)                    |
| - In-App & Push/Email Reminders                                                   |
| - Dark Mode Support                                                               |
+-----------------------------------------------------------------------------------+
```

---

## 6. Non-Functional Requirements (NFR)

1. **Performance & Latency:**
   - First Contentful Paint (FCP) < 1.2 detik.
   - Perhitungan `urgencyScore` dan pembaruan budget sisa selesai dalam < 100ms.
   - AI LLM response streaming *Time-to-first-token* (TTFT) < 1.5 detik.
2. **Security & Privacy:**
   - Password di-hash menggunakan Argon2id / bcrypt.
   - Proteksi multi-tenant ketat: seluruh query data terikat pada `userId` yang terotentikasi.
   - Data keuangan disimpan dengan tipe data `Decimal` presisi tinggi (bukan floating point).
3. **Usability & Accessibility:**
   - Memenuhi standar **WCAG AA** untuk kontras warna teks dan latar belakang pastel.
   - Mendukung navigasi keyboard penuh untuk form input dan shortcut aksi cepat.
4. **Reliability & Offline Capability (PWA Readiness):**
   - Penanganan *optimistic UI updates* saat mencatat transaksi dan menyelesaikan tugas.

---

## 7. Referensi Dokumen Terkait

- **Fitur Lengkap:** [FEATURES.md](file:///f:/Projects/Felys/FEATURES.md)
- **Algoritma & Formula AI:** [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md)
- **Struktur Database & ERD:** [DATABASE-SCHEMA.md](file:///f:/Projects/Felys/DATABASE-SCHEMA.md)
- **Design System & Palet Warna:** [UI.md](file:///f:/Projects/Felys/UI.md)
- **User Flow & Interaksi:** [UX.md](file:///f:/Projects/Felys/UX.md)
- **Brand Identity & Tone of Voice:** [BRANDING.md](file:///f:/Projects/Felys/BRANDING.md)
