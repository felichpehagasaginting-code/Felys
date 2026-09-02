# UX.md — Feluna Experience Design

> Pelengkap UI.md — fokus di alur, interaksi, dan logika pengalaman pengguna, bukan visual.

## 1. Prinsip UX

- **Zero Friction ke Insight** — user harus bisa liat "apa yang paling urgent hari ini" dalam <3 detik setelah buka app, tanpa scroll atau klik tambahan.
- **Satu Aksi, Satu Layar** — setiap tugas utama (tambah tugas, catat transaksi) selesai dalam 1 flow pendek, idealnya ≤3 langkah/tap.
- **AI sebagai Teman, Bukan Robot Notifikasi** — rekomendasi AI muncul kontekstual dan bisa di-dismiss, bukan popup maksa yang ganggu.
- **Konsisten Lintas Mode** — pola interaksi (cara nambah item, cara filter, cara liat detail) sama persis di kedua mode, cuma kontennya beda. User ga perlu belajar 2 cara pakai app.

## 2. Struktur Navigasi

```
Navbar Atas: [Logo] --- [Mode Switcher: Akademik | Finance] --- [AI Icon] [Profile]

Sidebar/Bottom Nav (ikut mode aktif):
Mode Akademik: Dashboard | Daftar Tugas | Kalender | Mata Kuliah
Mode Finance: Dashboard | Transaksi | Budget | Laporan
```

- Mode switcher **selalu terlihat** (sticky), karena ini fitur pembeda utama app — user harus selalu sadar dia bisa pindah mode kapan pun.
- Dashboard (home) di tiap mode nunjukkin ringkasan: 3-5 item paling penting, bukan semua data.

## 3. User Flow Utama

### Flow: Tambah Tugas (Mode Akademik)

1. Tap tombol "+" (floating action button, selalu di posisi sama di kedua mode)
2. Isi: nama tugas, pilih mata kuliah (dropdown/chip dari list yang udah ada), deadline (date picker), prioritas (3 opsi visual: rendah/sedang/tinggi), estimasi waktu (opsional, slider/input jam)
3. Simpan → langsung muncul di list, auto-sorted berdasarkan urgency score AI

### Flow: Catat Transaksi (Mode Finance)

1. Tap tombol "+" (posisi sama)
2. Isi: jenis (masuk/keluar — toggle 2 opsi), nominal (numpad besar, bukan input kecil), kategori (grid ikon, bukan dropdown teks), catatan (opsional)
3. Simpan → langsung update chart & sisa budget kategori terkait secara real-time (animasi angka berubah)

### Flow: Interaksi dengan AI Assistant

1. User buka AI panel (icon di navbar, badge notifikasi kalau ada insight baru)
2. AI kasih 1-3 kartu insight prioritas (bukan wall of text), masing-masing dengan CTA jelas: "Kerjain sekarang", "Lihat detail", "Abaikan"
3. User bisa tanya bebas ke AI (chat input di bawah panel) buat pertanyaan spesifik ("tugas apa yang paling ringan?", "boleh ga jajan hari ini?")

## 4. Logika Rekomendasi AI (dari sisi UX, bukan teknis)

**Mode Akademik:**

- Urutan tugas ditentukan dari kombinasi: deadline terdekat + prioritas manual + estimasi waktu pengerjaan
- Tugas yang "urgent" ditandai visual jelas (warna coral) di top of list, bukan cuma di-highlight tersembunyi
- Kalau user override urutan yang disaranin AI (drag-reorder manual), AI belajar dari situ buat next time

**Mode Finance:**

- Alert budget muncul progresif: notifikasi soft di 70% budget, warning lebih jelas di 90%, dan blocking-gentle (bukan blocking beneran) di >100%
- Saran "boleh ga belanja X" dijawab AI berdasarkan sisa budget kategori + jarak ke gajian/pemasukan berikutnya (kalau data ada)

**Cross-mode Insight (fitur pembeda):**

- Muncul di dashboard utama (bukan cuma di AI panel), sebagai 1 kartu highlight
- Contoh copy: *"Minggu ini ada 3 deadline mepet. Mungkin waktunya kurangin hangout dulu 👀"*
- Frekuensi dibatasi (max 1-2 insight cross-mode per hari) biar ga berasa nge-judge terus-terusan

## 5. Onboarding

1. Welcome screen singkat (1-2 layar max) jelasin konsep dual-mode + AI
2. Setup awal: user isi mata kuliah aktif (Mode Akademik) dan budget bulanan per kategori (Mode Finance) — bisa di-skip dan diisi nanti
3. Langsung masuk ke dashboard dengan empty-state yang friendly, ngajak nambah tugas/transaksi pertama

## 6. Micro-interactions & Apple-Grade Experience

- **Swipeable Cards (Mobile Gestures):** Swipe kanan pada card tugas untuk selesai (+ pop sound & confetti), swipe kiri untuk hapus (+ thud sound & undo toast) dengan elastisitas pegas iOS.
- **Drag-to-Scrub Segmented Controls:** Tekan & tahan pada segmented tab / switch, geser bebas dengan haptic tick real-time, dan lepas untuk mengaktifkan opsi.
- **Zero-Latency Sound Design:** Feedback audio prosedural Web Audio API (pop, thud, whoosh, tick, chime) yang responsif dan dapat diatur volumenya di Settings.
- **Fluid iOS Sliders:** Track dinamis dengan active fill, thumb scale-up saat ditekan, dan tooltip melayang.
- **Checklist & Selesai:** Animasi centang + strikethrough halus + confetti pop saat tugas selesai.
- **Switch Mode:** Transisi warna aksen fade smooth dan suara whoosh halus saat berpindah ruang.

## 7. Empty States

- Belum ada tugas: ilustrasi santai + copy ajakan ("Belum ada tugas nih, mau nambah yang pertama?")
- Belum ada transaksi: sama, dengan CTA "Catat transaksi pertama"
- AI belum punya cukup data: AI tetap muncul tapi kasih tau dia "masih belajar pola lu" — jangan disembunyikan total.

## 8. Aksesibilitas & Usability

- Kontras warna pastel tetap harus lolos WCAG AA minimal buat teks di atas background pastel (test tiap warna aksen vs teks)
- Semua aksi penting (simpan, hapus) harus reachable via keyboard, bukan cuma tap
- Konfirmasi sebelum hapus data (tugas/transaksi), tapi bukan modal ribet — cukup undo-toast ("Tugas dihapus. Undo?")

## 9. Prioritas MVP vs Nice-to-have

**MVP (harus ada):**

- CRUD tugas & transaksi, mode switcher, dashboard ringkasan, rekomendasi urutan tugas, budget alert dasar

**Nice-to-have (fase 2):**

- Cross-mode insight AI, chat bebas ke AI, kalender view, laporan/export data, dark mode
