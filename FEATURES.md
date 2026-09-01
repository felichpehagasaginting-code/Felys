# FEATURES.md — Felys Feature Specification

## 1. Mode Akademik — Task Manager

### 1.1 Manajemen Tugas (CRUD)

Field per tugas:

- `title` (string, required)
- `courseId` (relasi ke Mata Kuliah, required)
- `deadline` (datetime, required)
- `priority` (enum: low / medium / high, required, default: medium)
- `estimatedHours` (number, optional)
- `status` (enum: todo / in_progress / done, default: todo)
- `description` (text, optional)
- `createdAt`, `updatedAt` (auto)

### 1.2 Sub-task / Checklist

- Tiap tugas bisa punya banyak sub-task (`title`, `isDone`)
- Progress bar otomatis dari jumlah sub-task selesai
- Tugas induk auto-jadi `done` kalau semua sub-task checked (dengan konfirmasi, bukan otomatis penuh)

### 1.3 Mata Kuliah (Course)

- CRUD mata kuliah: `name`, `color` (buat tagging visual), `sks` (opsional, bisa dipakai buat bobot prioritas nanti)
- Filter daftar tugas per mata kuliah

### 1.4 Kalender & List View

- List view: default, grouped by "Hari ini / Minggu ini / Nanti / Selesai"
- Kalender view: bulanan, tugas muncul sebagai dot/badge di tanggal deadline-nya

### 1.5 Reminder / Notifikasi

- Notifikasi H-3, H-1, dan hari-H sebelum deadline (configurable di settings)
- In-app notification + opsional email/push (fase 2)

### 1.6 Urgency Sorting (ditenagai AI, detail di AI-LOGIC.md)

- Dashboard nunjukkin "Top 3-5 tugas yang harus dikerjain duluan"
- User bisa override urutan manual (drag & drop), sistem belajar dari override ini

---

## 2. Mode Finance — Personal Finance Tracker

### 2.1 Transaksi (CRUD)

Field per transaksi:

- `type` (enum: income / expense, required)
- `amount` (number, required)
- `categoryId` (relasi ke Kategori, required)
- `note` (string, optional)
- `date` (datetime, required, default: now)
- `createdAt`, `updatedAt` (auto)

### 2.2 Kategori

- Default kategori: Makan, Transport, Hiburan, Kebutuhan Kuliah, Belanja, Tagihan, Lainnya
- User bisa tambah kategori custom dengan ikon & warna

### 2.3 Budget

- Set budget bulanan per kategori (`categoryId`, `monthlyLimit`)
- Progress bar per kategori: terpakai vs limit
- Reset otomatis tiap awal bulan, histori bulan sebelumnya tetap tersimpan buat perbandingan

### 2.4 Visualisasi

- Pie/donut chart: distribusi pengeluaran per kategori (bulan berjalan)
- Line chart: trend pengeluaran harian/mingguan dalam sebulan
- Perbandingan bulan ini vs bulan lalu (opsional, fase 2)

### 2.5 Riwayat Transaksi

- List transaksi dengan filter: rentang tanggal, kategori, tipe (masuk/keluar)
- Search by note/keyword

---

## 3. AI Assistant — Fitur Lintas Mode

### 3.1 Task Recommendation Panel

- Kartu insight: "3 tugas paling urgent minggu ini", dengan alasan singkat kenapa (deadline dekat / prioritas tinggi)
- CTA langsung: "Mulai kerjain" (ubah status jadi in_progress)

### 3.2 Budget Alert & Saving Tips

- Notifikasi progresif (70% / 90% / 100%+ dari budget kategori)
- Saran kategori mana yang bisa dikurangi berdasarkan proporsi pengeluaran

### 3.3 Cross-Mode Insight (fitur unggulan)

- Kartu insight di dashboard utama yang menggabungkan data akademik + finance
- Contoh: banyak deadline urgent → saran kurangi pengeluaran non-esensial minggu ini
- Detail logika ada di `AI-LOGIC.md`

### 3.4 Chat Bebas (fase 2)

- Input chat di panel AI, user bisa tanya bebas ("tugas apa yang paling ringan?", "sisa budget makan berapa?")

---

## 4. Fitur Pendukung (Cross-cutting)

- **Auth:** email/password + opsional Google OAuth (NextAuth.js)
- **Settings:** ubah tema (light/dark), atur reminder, kelola kategori & mata kuliah
- **Dashboard Home:** ringkasan gabungan — top tugas urgent + ringkasan budget bulan ini + 1 cross-mode insight
- **Mode Switcher:** toggle persisten di navbar, state tersimpan (last active mode saat login lagi)

---

## 5. Prioritas Implementasi

| Fase | Fitur |
| --- | --- |
| MVP | 1.1, 1.3, 1.4 (list only), 2.1, 2.2, 2.3, 3.1 (basic), 3.2 (basic), Auth, Mode Switcher, Dashboard |
| Fase 2 | 1.2 (sub-task), 1.5 (reminder), 1.4 (calendar view), 2.4 (chart lanjutan), 3.3 (cross-mode insight), 3.4 (chat AI), dark mode |
