# 📘 FELYS — Master Product & Architecture Blueprint
> **Dokumen Sumber Komprehensif untuk Pembuatan Infografis, Rangkuman Eksekutif, & Presentasi NotebookLM**

---

## 🌟 1. Identitas Produk & Visi Utama

| Parameter | Detail Produk |
| :--- | :--- |
| **Nama Aplikasi** | **Felys** |
| **Persona AI Terintegrasi** | **"Fio"** (Asisten Cerdas Mahasiswa) |
| **Tagline Utama** | *"Atur waktu, atur uang, tenang aja."* / *"Satu ruang terpadu buat tugas kuliah dan dompetmu."* |
| **Kategori** | *Dual-Mode Productivity & Personal Finance Web App powered by Contextual AI* |
| **Target Pengguna** | Mahasiswa aktif (D3/S1, Usia 18–24 tahun) yang tinggal mandiri/kos dengan beban tugas kuliah padat dan anggaran keuangan terbatas. |
| **Inti Masalah (*Problem Statement*)** | Mahasiswa mengalami *app fatigue* akibat terpaksa memisahkan catatan tugas (Notion/Todoist) dan keuangan (Money Lover/Excel). Mereka tidak menyadari korelasi bahwa **ketika deadline tugas menumpuk, pengeluaran impulsif (*stress buying* seperti kopi dan jajan) ikut melonjak**. |
| **Solusi Unik (*Unique Value Proposition*)** | Felys menyatukan manajemen tugas akademik dan manajemen keuangan dalam **1 ekosistem *Dual-Mode* yang mulus**, ditenagai kecerdasan buatan (*Cross-Mode Contextual AI*) yang mendeteksi hubungan beban tugas dan kesehatan dompet secara *real-time*. |

---

## 🎨 2. Sistem Desain & Estetika Visual (*Warm Aesthetic*)

Felys mengusung filosofi desain modern dengan palet warna hangat (*Warm Cream & Dark Espresso*) yang nyaman di mata untuk penggunaan berjam-jam:

### 🌈 Palet Warna Utama
- **Light Mode Background:** Warm Cream / Oat (`#F8F6F2`) — Memberikan kesan sejuk, elegan, dan ramah di mata tanpa silau putih ekstrem.
- **Dark Mode Background:** Warm Espresso / Charcoal (`#181716`) — Gelap organik dengan nuansa kopi hitam hangat, bukan hitam pekat OLED yang kontras tajam.
- **Aksen Mode Akademik:** Lavender Pop (`#B69CFF` / `#7C5CFA`) — Menstimulasi fokus, kreativitas, dan ketenangan belajar.
- **Aksen Mode Keuangan:** Mint Pop (`#7FE3C0` / `#1F8766`) — Melambangkan kesegaran, pertumbuhan aset, dan keamanan finansial.
- **Warna Status & Indikator:**
  - 🔴 Coral (`#FF7A85`): Tugas mendesak / Overbudget / Aksi Hapus
  - 🟡 Amber / Peach (`#FFC978`): Prioritas sedang / Warning limit anggaran
  - 🟢 Soft Mint (`#7FE3C0`): Prioritas rendah / Anggaran aman / Tugas tuntas
  - 🔵 Sky Blue (`#8EC8FF`): Tagihan kos & kebutuhan kuliah

---

## 🍎 3. Pengalaman Pengguna Kelas Apple (*Apple-Grade UX & Micro-Interactions*)

Felys dirancang dengan interaksi taktil, fisika pegas (*spring physics*), dan umpan balik audio prosedural tanpa latensi:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLE-GRADE INTERACTION ENGINE                  │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ 👆 Mobile Swipe   │ 🎛️ Drag-to-Scrub Controls │ 🔊 Zero-Latency Audio │
│    Gestures       │    (Hold-Slide-Release)    │    Web Synthesizer    │
├───────────────────┼────────────────────────────┼───────────────────────┤
│ • Swipe Kanan:    │ • Press & Hold:            │ • 100% Prosedural     │
│   Tandai Selesai  │   Kapsul mengunci ke jari  │   Web Audio API       │
│   + Pop + Confetti│ • Live Dragging:           │ • Zero MP3 File Draw  │
│ • Swipe Kiri:     │   Geser mulus + Haptic     │ • Suara Unik:         │
│   Hapus + Thud    │ • Release to Choose:       │   - Pop (Check task)  │
│   + 5s Undo Toast │   Snap otomatis ke opsi    │   - Thud (Delete)     │
│ • Rubber-Band     │ • Diterapkan pada Pomodoro,│   - Whoosh (Mode)     │
│   Spring Physics  │   Numpad, Prioritas, Tabs  │   - Chime (Success)   │
└───────────────────┴────────────────────────────┴───────────────────────┘
```

1. **Mobile Swipeable Cards:**
   - **Swipe Kanan (>85px):** Mengungkap background hijau mint, mengeksekusi *Mark as Done*, memicu suara `playPop()`, getaran haptic, dan letupan konfeti.
   - **Swipe Kiri (<-85px):** Mengungkap background merah coral, menghapus item dengan suara `playThud()`, dan menampilkan *Undo Toast* 5 detik untuk memulihkan data jika tidak sengaja terhapus.
2. **Interactive Drag-to-Scrub Segmented Control (`IOSSegmentedControl`):**
   - Pengguna dapat **menekan, menahan jari, menggeser bebas antar-opsi** dengan *real-time haptic tick sound*, dan **melepaskan jari untuk memilih** opsi secara instan.
   - Diterapkan pada: Switcher Mode (Akademik ↔ Finance), Prioritas Tugas, Timer Pomodoro, Numpad Pengeluaran/Pemasukan, dan Tab Talangan.
3. **Fluid iOS Slider (`IOSSlider`):**
   - Slider cairan dengan thumb membesar dinamis (*spring scale 1.25x*), *active track fill*, *floating live tooltip*, dan *tick sound* mikro.
4. **Zero-Latency Web Audio Synthesizer:**
   - Synthesizer prosedural tanpa unduhan file audio eksternal (0 KB memory draw) yang menghasilkan suara *crisp* dan responsif seketika.

---

## 🏛️ 4. Dua Pilar Utama Felys (*The Dual-Mode Architecture*)

### 🎓 PILAR 1: Mode Akademik (Lavender Space)
1. **Urgency Scoring Engine Otomatis:**
   Sistem secara otomatis menghitung skor urgensi setiap tugas (skala 0–100) menggunakan formula matematis berbobot:
   $$\text{Urgency Score } (U) = (0.5 \times D) + (0.3 \times P) + (0.2 \times E)$$
   - **Deadline Factor ($D$ - 50%):** $\le 24$ jam (100) • $\le 3$ hari (80) • $\le 7$ hari (50) • $> 7$ hari (20) • Lewat deadline (100)
   - **Priority Factor ($P$ - 30%):** Tinggi (100) • Sedang (60) • Rendah (30)
   - **Effort Factor ($E$ - 20%):** $\ge 8$ jam (100) • 4–7 jam (70) • 1–3 jam (40)
2. **Checklist & Sub-Tasks:** Memecah tugas besar (skripsi/makalah) menjadi langkah-langkah kecil dengan *progress bar* visual.
3. **Countdown Target D-Day:** Hitung mundur hari menuju UTS, UAS, atau Sidang Skripsi yang terpampang jelas di bagian atas dashboard.
4. **Jadwal Kuliah Mingguan (*Weekly Timetable*):** Manajemen kelas 5 hari (Senin–Jumat) lengkap dengan ruangan, jam, dan SKS.
5. **Kalender Deadline Interaktif:** Visualisasi titik warna tugas berdasarkan mata kuliah.

---

### 💸 PILAR 2: Mode Keuangan (Mint Space)
1. **Multi-Account Allocation (Dompet & Rekening Asli):**
   Mahasiswa dapat membagi saldo riil ke rekening/e-wallet berlogo resmi:
   - **GoPay / ShopeePay / DANA / OVO:** Saldo jajan harian, QRIS, & transportasi.
   - **SeaBank / Superbank / BCA / Mandiri / BRI / BNI:** Tabungan utama & uang saku dari orang tua.
   - **Uang Tunai (Cash):** Uang fisik di dompet untuk makan di warung/kantin.
   - **Fitur Unggulan:** Ubah Saldo Langsung (*Reconciliation*), Transfer Antar-Akun (*0 net cashflow*), dan Pemantauan Total Kekayaan Bersih (*Net Worth*).
2. **Numpad Quick Entry (Zero-Friction):**
   Catat pengeluaran dalam waktu < 5 detik dengan tombol instan `+000`, pemilih sumber rekening, dan grid 18 kategori mahasiswa.
3. **Batas Anggaran Bulanan Progresif (*Budget Limits*):**
   Indikator dinamis 4 level: 🟢 Aman ($<70\%$) $\rightarrow$ 🟡 Perhatian ($70-89\%$) $\rightarrow$ 🟠 Warning ($90-99\%$) $\rightarrow$ 🔴 Overbudget ($\ge 100\%$).
4. **Kalkulator Patungan & Pelacak Talangan (*Split Bill & IOU*):**
   Hitung pembagian bill makan bersama teman (sama rata / custom), generator pesan tagihan sopan via WhatsApp, dan tombol 1-tap tandai lunas yang otomatis menambah saldo kas.
5. **Celengan Impian (*Savings Goals*):**
   Target tabungan khusus (laptop baru, tiket liburan semester) dengan fitur setor otomatis dari sisa jatah harian.
6. **Kantong Dana Darurat Kos (*Emergency Fund*):**
   Cadangan kas darurat terpisah dari jatah belanja harian + fitur *rollover* otomatis sisa surplus anggaran akhir bulan.

---

## 🤖 5. Kecerdasan Kontekstual AI ("Fio")

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI CONTEXTUAL INTELLIGENCE                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ 💡 Cross-Mode Insight Engine      │ 💬 Streaming Chat & Assistant      │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Mendeteksi jika:                │ • Multi-Tier Production Fallback:  │
│   - Deadline Padat (≥2 tugas ≤7d) │   Gemini 2.5 Flash                 │
│   - & Budget Jajan Kritis (≥70%)  │     └── Gemini 2.0 Flash           │
│ • Saran Solutif & Bersahabat:     │           └── Gemini 1.5 Flash     │
│   "Yuk nugas di kos sambil seduh  │ • Membaca jadwal kuliah, tugas,    │
│    kopi sachet, hemat & fokus!"   │   dan transaksi secara live        │
└───────────────────────────────────┴────────────────────────────────────┘
```

1. **Cross-Mode Insight Heuristics:**
   Menghubungkan dua dunia mahasiswa. Menghindari "kebocoran halus" saat mahasiswa melampiaskan stres deadline tugas dengan membeli makanan/minuman mahal di luar kos.
2. **Google Gemini Production Resilience:**
   Menggunakan arsitektur *fallback* 3 tingkat (`gemini-2.5-flash` $\rightarrow$ `gemini-2.0-flash` $\rightarrow$ `gemini-1.5-flash`) untuk menjamin asisten AI selalu aktif 100% tanpa kendala limit kuota.
3. **NLP Quick Input Parser:**
   Mengetik satu kalimat santai bahasa Indonesia (misal: *"Makan siang geprek 18rb pake gopay"* atau *"Tugas AI jumat jam 23:59"*), sistem otomatis mengekstrak nominal, tanggal, kategori, dan menyimpannya.
4. **Client-Side Real OCR Engine:**
   Pemindaian struk belanja fisik langsung di browser menggunakan `tesseract.js` Web Worker + filter kontras kanvas tanpa mengirim foto ke server eksternal (*privacy-first*).

---

## 🖥️ 6. Always-Open Web Companion (Didesain untuk Laptop Mahasiswa)

Felys dirancang agar dapat **dibiarkan terbuka sepanjang hari di latar belakang** tanpa memboroskan baterai laptop:

1. 🍅 **Pomodoro Focus Timer dengan Dynamic Tab Title:** Judul tab browser otomatis menampilkan countdown (`[🍅 24:50] Tugas | Felys`). Dilengkapi melodi Web Audio Synth saat sesi fokus selesai.
2. 🪟 **Floating Picture-in-Picture (PiP) Companion:** Mini window Felys mengambang di atas dokumen Word, VS Code, Canva, atau PowerPoint.
3. 📝 **Lecture Scratchpad & Sticky Notes:** Papan coretan cepat dengan debounced auto-save (500ms).
4. ⏳ **Live Class Agenda:** Status realtime kelas yang sedang berlangsung vs kelas berikutnya dengan countdown menit.
5. 📖 **Split-Screen PDF Lecture Reader + AI Explainer:** Unggah slide PDF materi kuliah, teks diekstrak di browser (`unpdf`), dan bisa langsung ditanyakan ke Fio AI tanpa copas manual.

---

## 🏗️ 7. Arsitektur Teknis & Persistensi Data (*100% Offline-First*)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE PIPELINE                       │
├───────────────────────────────────┬────────────────────────────────────┤
│ 📱 Mode Offline / Demo            │ ☁️ Mode Online / Terautentikasi    │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Inisialisasi instan via         │ • Sinkronisasi real-time dua arah  │
│   `loadLocal()` dari LocalStorage │   via Cloud Firestore onSnapshot   │
│ • Setiap mutasi data (CRUD)       │ • Keamanan berbasis kepemilikan di │
│   langsung di-commit via          │   `firestore.rules`                │
│   `saveLocal()` (0% Data Loss)    │ • Backup lokal tetap aktif         │
└───────────────────────────────────┴────────────────────────────────────┘
```

- **Frontend Framework:** Next.js 15.5 (App Router), React 19, TypeScript 5, Tailwind CSS 3.4.
- **Interactivity & Motion:** Framer Motion (Spring Physics), Radix UI Primitives, Lucide Icons, Canvas Confetti.
- **State Management:** Zustand dengan arsitektur reaktif dan sinkronisasi ganda (LocalStorage + Firestore).
- **Database & Keamanan:** Google Cloud Firestore dengan isolasi multi-user `/users/{userId}/...` untuk semua subkoleksi (`courses`, `tasks`, `transactions`, `accounts`, `budgets`, `savings_goals`, `recurring_bills`, `debts`).
- **PWA & Platform:** Progressive Web App dengan dukungan instalasi mobile & desktop, offline-first caching, dan responsivitas adaptif.

---

## 📊 8. Panduan Elemen Kunci untuk Infografis NotebookLM

Jika memasukkan file ini ke NotebookLM untuk membuat infografis atau slide ringkasan, berikut adalah visualisasi dan sorotan utama yang disarankan:

### 📌 Struktur 4 Kuadran Infografis
1. **Kuadran 1 (Problem & Solution):** Mahasiswa vs Beban Ganda $\rightarrow$ Solusi Felys Dual-Mode + Fio AI.
2. **Kuadran 2 (Mode Akademik & Formula AI):** Urgency Score $U = 0.5D + 0.3P + 0.2E$, Countdown D-Day, Checklist tugas.
3. **Kuadran 3 (Mode Keuangan & Multi-Account):** Alokasi Saldo Bank/E-Wallet, Numpad Quick Entry, Split Bill WhatsApp, Dana Darurat.
4. **Kuadran 4 (Apple-Grade Experience & Tech):** Swipe Gestures, Drag-to-Scrub Segmented Control, Web Audio Synth, Always-Open Web Companion.

### 🔑 Statistik & Fakta Menarik untuk Highlight Infografis
- **Waktu Pencatatan:** $< 5$ detik dengan Numpad Cepat & NLP Parser Bahasa Indonesia.
- **Ukuran Beban Audio:** $0\text{ KB}$ file MP3 (100% prosedural Web Audio API).
- **Keamanan Data:** $100\%$ Offline-First Persistence (data tidak pernah hilang meski tanpa internet).
- **Tingkat Resiliensi AI:** 3-Tier Multi-Model Fallback Chain (Gemini 2.5 $\rightarrow$ 2.0 $\rightarrow$ 1.5).
- **Ekosistem Rekening:** Mendukung 10+ Bank & E-Wallet Nasional (GoPay, SeaBank, BCA, Superbank, DANA, dll.).
