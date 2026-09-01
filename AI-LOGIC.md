# AI-LOGIC.md — Felys AI Assistant Logic Spec

## 1. Tujuan

Dokumen ini nge-define **kapan** dan **berdasarkan apa** AI assistant kasih rekomendasi, biar implementasinya konsisten dan ga "ngarang" tiap kali generate insight.

---

## 2. Mode Akademik: Urgency Score

### 2.1 Formula

Setiap task dapat `urgencyScore` (0-100), dihitung dari 3 faktor berbobot:

```
urgencyScore = (W1 × deadlineFactor) + (W2 × priorityFactor) + (W3 × effortFactor)

W1 = 0.5   (deadline paling dominan)
W2 = 0.3   (prioritas manual dari user)
W3 = 0.2   (estimasi waktu pengerjaan)
```

**deadlineFactor** (0-100): makin dekat deadline, makin tinggi.

- ≤1 hari lagi → 100
- 2-3 hari → 80
- 4-7 hari → 50
- 8-14 hari → 25
- >14 hari → 10

**priorityFactor** (0-100): dari input manual user

- high → 100, medium → 60, low → 30

**effortFactor** (0-100): tugas yang butuh waktu lama tapi deadline dekat harus naik urgensinya

- Kalau `estimatedHours` ga diisi → default 50 (netral)
- Kalau estimatedHours tinggi & deadline dekat → dinaikin (rasio jam tersisa vs estimasi)

### 2.2 Kapan Dihitung Ulang

- Saat task dibuat/diedit (deadline, priority, atau estimatedHours berubah)
- Scheduled job harian (jam 00:00) buat update `deadlineFactor` semua task aktif (karena "hari tersisa" berubah tiap hari walau data lain ga berubah)

### 2.3 Override Manual

- Kalau user drag-reorder task secara manual, simpan ke `manualOrder`
- Urutan tampil = `manualOrder` kalau ada, fallback ke `urgencyScore` kalau ga ada
- (Fase lanjut, opsional) log override buat kalibrasi bobot W1/W2/W3 per user

### 2.4 Trigger Insight "Top Urgent Tasks"

- Ambil top 3-5 task dengan `urgencyScore` tertinggi yang status-nya masih `todo`/`in_progress`
- Tampilkan di dashboard tiap kali user buka app (bukan real-time push, cukup on-load)

---

## 3. Mode Finance: Budget Alert

### 3.1 Threshold Progresif

Dihitung per kategori, per bulan berjalan: `usedPercentage = (totalExpenseKategori / monthlyLimit) × 100`

| Threshold | Level | Aksi UX |
| --- | --- | --- |
| < 70% | Aman | Ga ada notifikasi, cuma progress bar hijau/mint |
| 70-89% | Perhatian | Insight card soft: "Budget [kategori] udah kepake 75%" |
| 90-99% | Warning | Insight card lebih jelas + saran: "Sisa budget [kategori] tinggal Rp X, mendingan direm dulu" |
| ≥100% | Overbudget | Insight card status urgent (coral), bukan blocking — tetap bisa transaksi, tapi ditandai jelas |

### 3.2 Trigger Perhitungan

- Real-time setiap ada transaksi baru dengan `type: expense`
- Insight muncul cuma kalau ada perubahan level threshold (jangan spam insight tiap transaksi kecil kalau levelnya masih sama)

### 3.3 Saran Kategori yang Bisa Dikurangi

- Bandingkan proporsi tiap kategori terhadap total pengeluaran bulan ini
- Kategori "non-esensial" (default: Hiburan, Belanja, Lainnya — bisa dikustomisasi user) dengan proporsi terbesar → jadi kandidat saran pengurangan
- Kategori esensial (Makan, Transport, Kebutuhan Kuliah) tidak disarankan untuk dikurangi kecuali user set flag manual

---

## 4. Cross-Mode Insight (Fitur Unggulan)

### 4.1 Trigger Condition

Insight ini muncul kalau **kedua** kondisi berikut terpenuhi bersamaan:

1. Ada ≥2 task dengan `urgencyScore` ≥80 dalam 7 hari ke depan
2. Ada minimal 1 kategori finance non-esensial yang sudah masuk threshold "Perhatian" (≥70%) bulan ini

### 4.2 Format Insight

- Template: *"Minggu ini ada [N] deadline mepet ([daftar mata kuliah]). Budget [kategori] juga udah kepake [X]%, coba direm dulu biar fokus ngerjain tugas."*
- 1 kartu, muncul di dashboard utama (bukan cuma di panel AI)

### 4.3 Frekuensi & Dismiss

- Maksimal 1 cross-mode insight aktif per hari (kalau kondisi tetap terpenuhi besoknya, insight baru muncul lagi — tapi ga numpuk beberapa sekaligus)
- User bisa dismiss (`isDismissed: true`), insight yang sama ga muncul lagi dalam 24 jam meski kondisi masih sama

---

## 5. Chat Bebas AI (Fase 2)

- Prompt context yang dikirim ke LLM setiap chat: ringkasan task aktif (top 5 by urgencyScore) + ringkasan budget bulan berjalan (per kategori: limit, used, remaining)
- System prompt AI harus dibatasi cuma jawab seputar data task & finance user — bukan general assistant tanpa batas, biar tetap fokus ke fungsi utama app
- Response AI harus bisa reference data spesifik (nama tugas, nominal), bukan jawaban generik

---

## 6. Catatan Implementasi

- Semua perhitungan skor (urgency, budget %) sebaiknya dihitung di backend/server, bukan client — biar konsisten across device dan bisa dipakai buat scheduled job/notifikasi.
- AI insight (cross-mode & chat) yang butuh LLM call sebaiknya di-cache/rate-limit per user (misal max regenerate tiap beberapa jam) buat kontrol biaya API.
