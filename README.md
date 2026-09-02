<div align="center">

# ✨ Felys (AI Assistant: "Fio")

**"Atur waktu, atur uang, tenang aja."**

*Platform produktivitas akademik & manajemen keuangan mahasiswa terintegrasi berbasis Contextual AI, Always-Open Web Companion, Multi-Account Allocation, & Offline-First Persistence.*

[![Next.js](https://img.shields.io/badge/Next.js-15.5_(App_Router)-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_SDK-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

[Fitur Utama](#-fitur-unggulan) • [Upgrade Terbaru](#-fitur-dan-upgrade-terbaru) • [Multi-Account & E-Wallet](#-alokasi-penyimpanan-multi-rekening--e-wallet) • [Always-Open Web Companion](#-always-open-web-companion) • [Arsitektur](#-arsitektur--tech-stack) • [Formula AI](#-ai-engine--urgency-scoring) • [Panduan Instalasi](#-cara-menjalankan-proyek) • [Dokumentasi](#-arsip-dokumentasi)

</div>

---

## 🌟 Sekilas Tentang Felys

Sebagai mahasiswa, dua beban terbesar dalam keseharian adalah **deadline tugas kuliah yang menumpuk** dan **keuangan/uang saku yang cepat habis**. Seringkali aplikasi pencatat tugas dan aplikasi keuangan terpisah, sehingga mahasiswa tidak menyadari korelasi bahwa saat deadline menumpuk, pengeluaran impulsif untuk kopi, jajan, dan nongkrong ikut melonjak.

**Felys** hadir sebagai solusi all-in-one dengan **Dual-Mode System** (*Mode Akademik* & *Mode Keuangan*) yang disatukan oleh asisten AI pintar bernama **Fio**, serta dirancang khusus sebagai **Always-Open Companion** yang ringan dan hemat daya baterai di laptop mahasiswa.

---

## 🚀 Fitur Unggulan

### 🎓 1. Mode Akademik (Lavender Pop `#B69CFF`)
- **Urgency Scoring Engine Otomatis:** Menghitung skor urgensi setiap tugas secara matematis (0 - 100) berdasarkan sisa waktu deadline, tingkat prioritas, dan estimasi jam pengerjaan.
- **Target D-Day Countdown (UTS / UAS / Sidang Skripsi):** Hitung mundur target akademik penting yang tersinkronisasi *real-time* dan permanen di Cloud Firestore.
- **Daftar Tugas & Checklist Sub-tasks:** Cicil tugas besar menjadi langkah-langkah kecil dengan indikator progres visual dan selebrasi konfeti saat tugas tuntas.
- **Kalender Deadline Interaktif:** Visualisasi titik warna tugas berdasarkan mata kuliah untuk memetakan beban belajar bulanan.
- **Manajemen Mata Kuliah & Jadwal Kelas:** Kelola SKS, dosen, ruang kelas, tag warna kustom, dan monitoring tugas aktif per mata kuliah.

### 💸 2. Mode Keuangan (Mint Pop `#7FE3C0`)
- **Numpad Quick Entry (Zero-Friction):** Catat transaksi dalam hitungan detik dengan tombol instan `+000`, backspace, pemilih sumber dompet/rekening, dan grid kategori 1-tap.
- **18 Kategori Mahasiswa Lengkap:** 
  - *Pengeluaran:* Makan & Minum, Transportasi, Kebutuhan Kuliah, Tagihan & Kos, Hiburan, Kopi & Jajan, Belanja, Kesehatan, Pulsa/Langganan, dan Lainnya.
  - *Pemasukan:* Uang Saku & Ortu, Gaji/Part-time, Beasiswa, Freelance/Projek, Jualan/Usaha, Hadiah/Bonus, Investasi/Cashback, dan Lainnya.
- **Batas Anggaran Progresif:** Indikator visual real-time dengan 4 level status:
  - 🟢 **Aman** ($< 70\%$)
  - 🟡 **Perhatian** ($70\% - 89\%$)
  - 🟠 **Warning** ($90\% - 99\%$)
  - 🔴 **Overbudget** ($\ge 100\%$)
- **Kantong Dana Darurat & Celengan Impian (*Savings Goals*):** Sisihkan tabungan khusus laptop baru, liburan semester, atau dana darurat kosan secara otomatis.

### 🤖 3. Engine Asisten AI "Fio" & Insight Lintas Mode
- **Insight Lintas Mode (Cross-Mode Heuristics):** Mendeteksi otomatis saat pengguna memiliki $\ge 2$ deadline mendesak ($\le 7$ hari) dan pengeluaran non-esensial sudah $\ge 70\%$, lalu memberikan saran solutif (misal: ajakan ngerjain tugas di kos sambil seduh kopi hemat).
- **Streaming Chat Drawer:** Obrolan interaktif real-time ditenagai **Google Gemini API** yang membaca data tugas, jadwal kuliah, dokumen materi PDF, dan kondisi budget pengguna secara kontekstual.
- **Production Multi-Tier Fallback Chain:** Otomatis berganti model (`gemini-2.5-flash` $\rightarrow$ `gemini-2.0-flash` $\rightarrow$ `gemini-1.5-flash`) untuk menjamin AI 100% selalu online dan stabil di production.

---

## 💳 Alokasi Penyimpanan Multi-Rekening & E-Wallet

Mahasiswa dapat membagi dan mengelola alokasi saldo uang mereka ke berbagai rekening dan dompet digital dengan **Logo Asli Platform**:

| Platform | Logo Resmi | Fitur & Integrasi |
| :--- | :---: | :--- |
| **GoPay** | 🟢 Official GoTo Blue/Green | Sumber dana transaksi & saldo jajan |
| **Superbank** | 🟡 Official Dark & Neon Lime | Tabungan bunga tinggi & alokasi belanja |
| **SeaBank** | 🟠 Official SeaBank Coral/Orange | Rekening tabungan utama & transfer gratis |
| **DANA** | 🔵 Official DANA Blue | Pembayaran QRIS & tagihan kos |
| **OVO** | 🟣 Official OVO Royal Purple | Transportasi & jajan online |
| **ShopeePay** | 🔴 Official ShopeePay Orange | Belanja kebutuhan kuliah online |
| **BCA, Mandiri, BRI, BNI** | 🏛️ Official Banking Emblems | Transfer uang saku orang tua & beasiswa |
| **Uang Tunai (Cash)** | 💵 Mint Green Cash Badge | Uang fisik di dompet untuk warung/kantin |

### ⚡ Keunggulan Fitur Akun:
- ✏️ **Ubah Saldo Langsung (*Direct Balance Reconciliation*):** Sesuaikan nominal saldo riil kapan saja tanpa dicatat sebagai transaksi pengeluaran/pemasukan, menjaga grafik arus kas tetap bersih.
- 🔄 **Pindah Saldo Antar-Akun (*Inter-Account Transfer*):** Pindahkan saldo (misal: top-up GoPay dari SeaBank) dengan *net cashflow* tetap 0.
- 💰 **Total Net Worth Real-Time:** Monitoring total kekayaan aktif di semua platform dalam 1 layar.

---

## 🖥️ Always-Open Web Companion

Dirancang khusus agar tab Felys dapat dibuka sepanjang hari di latar belakang tanpa memboroskan baterai laptop:

1. 🍅 **Pomodoro Focus Timer dengan Dynamic Tab Title:** 
   - Judul tab browser otomatis menampilkan countdown aktif (contoh: `[🍅 24:50] Tugas | Felys`).
   - Melodic Web Audio Synth Chime ($C_5 \rightarrow E_5 \rightarrow G_5$) dengan *zero MP3 memory draw*.
   - Dukungan Web Notification API untuk notifikasi desktop saat sesi selesai.
2. 🪟 **Floating Picture-in-Picture (PiP) Mini Companion:**
   - Mini window Felys mengambang di atas Microsoft Word, VS Code, Canva, atau PPT saat nugas.
3. 📝 **Lecture Scratchpad & Sticky Notes:**
   - Catatan coret-coret cepat dengan debounced 500ms auto-save ke IndexedDB.
4. ⏳ **Live Class Agenda:**
   - Status realtime kelas yang sedang berlangsung vs kelas berikutnya dengan countdown menit.
5. 📖 **Split-Screen PDF Lecture Reader + Contextual AI:**
   - Unggah slide PDF materi kuliah, teks diekstrak otomatis di sisi klien (`unpdf`), dan langsung ditanyakan ke Fio AI tanpa perlu copas manual.

---

## 🔥 Fitur dan Upgrade Tambahan

| Fitur / Modul | Deskripsi & Manfaat Bagi Mahasiswa |
| :--- | :--- |
| ⚡ **NLP Quick Input Bar** | Parser kalimat natural bahasa Indonesia (*contoh: "Makan siang geprek 18rb"* atau *"Makalah AI jumat jam 23:59"*) dengan *live preview chip*. |
| 🧠 **Web Worker Real OCR Engine** | Pemindaian struk nyata dengan `tesseract.js` + Canvas contrast boost 100% di browser tanpa kirim foto ke server luar (*privacy-first*). |
| 📅 **Google & Apple Calendar Sync** | Ekspor `.ics` standar RFC 5545 dengan pengingat otomatis H-1 & H-2 jam, serta 1-tap sinkronisasi langsung ke Google Calendar. |
| 👥 **Split Bill & IOU Tracker** | Kalkulator patungan makan/kelompok dengan generator pesan pengingat WhatsApp sopan dan pelunasan otomatis ke saldo kas. |
| 📶 **Offline-First Persistence** | Firestore IndexedDB Cache dengan multi-tab sync. Mahasiswa tetap bisa mencatat pengeluaran di kantin atau mencentang tugas di lab saat tanpa internet (*zero data loss*). |
| 📅 **Tagihan & Biaya Rutin Mahasiswa** | Kelola pengingat pembayaran uang kos bulanan, UKT/SPP semesteran, WiFi, dan langganan dengan tombol *1-Click Pay & Record*. |
| 🛡️ **Proteksi AI & Rate Limiting** | Keamanan token Firebase Auth + sliding-window rate limiter (maksimal 40 request/24 jam per akun) untuk mencegah lonjakan kuota API. |
| 📳 **Haptic Tactile & Undo Toast** | Getaran tactile pada perangkat mobile PWA, konfirmasi hapus data, serta **Tombol Undo (Batalkan)** 5 detik untuk memulihkan catatan yang tidak sengaja terhapus. |
| 📱 **Progressive Web App (PWA)** | Install ke layar utama iPhone/Android dengan ikon kustom elegan dual-mode (*no AI slop*). |

---

## 🧠 AI Engine & Urgency Scoring

Skor urgensi tugas ($U$) dihitung secara otomatis menggunakan formula linear berbobot:

$$U = (0.5 \times D) + (0.3 \times P) + (0.2 \times E)$$

| Faktor | Bobot | Parameter & Nilai |
| :--- | :---: | :--- |
| **Deadline Factor ($D$)** | **50%** | $\le 24$ jam (100) • $\le 3$ hari (80) • $\le 7$ hari (50) • $> 7$ hari (20) • Overdue (100) |
| **Priority Factor ($P$)** | **30%** | High (100) • Medium (60) • Low (30) |
| **Effort Factor ($E$)** | **20%** | $\ge 8$ jam (100) • 4–7 jam (70) • 1–3 jam (40) |

---

## 🛠️ Arsitektur & Tech Stack

```
Felys/
├── public/
│   ├── logos/                  # Official Bank & E-Wallet SVG Vectors (GoPay, SeaBank, BCA, dll.)
│   ├── icon.png & apple-icon   # High-resolution PWA App Badges
│   └── manifest.webmanifest    # Progressive Web App Manifest
├── src/
│   ├── app/                    # Next.js 15 App Router (Pages, API Routes, Layouts)
│   │   ├── (auth)/             # Authentication Routes (/login, /register)
│   │   ├── (dashboard)/        # Unified Dashboard, Academic, Finance, & Settings
│   │   └── api/ai/             # Streaming Chat & Breakdown API with Gemini Multi-Model Fallback
│   ├── components/             # Reusable UI Components & Modals
│   │   ├── academic/           # TaskCard, CourseModal, PomodoroWidget, DDayCountdownBanner, PDFLectureReaderModal
│   │   ├── finance/            # AccountOverviewGrid, AccountProviderLogo, AdjustBalanceModal, NumpadQuickEntry, ReceiptScanModal
│   │   ├── ai/                 # AIDrawer, InsightCard
│   │   ├── shared/             # NLPQuickBar, Navbar, PiPCompanionModal, ScratchpadPanel, ModeSwitcher
│   │   └── ui/                 # Base Radix Primitives, Modals, ConfirmDialog, Skeletons
│   ├── lib/                    # Firebase Firestore Service, Notification Service, unpdf extractor, Haptics
│   ├── server/services/        # Urgency, Budget, & Cross-Mode Insight Services
│   ├── stores/                 # Zustand State Stores (Data, Pomodoro, AI, Auth, Mode)
│   └── types/                  # TypeScript Data Models & Contracts
```

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI Primitives, Lucide React, Recharts, Sonner.
- **Database & Auth:** Google Cloud Firestore (IndexedDB Offline Cache + `/users/{userId}/...`), Firebase Authentication.
- **PDF & OCR:** `unpdf` client parser, `tesseract.js` Web Worker OCR.
- **AI Engine:** Google Gemini API (`@ai-sdk/google` + Vercel AI SDK).
- **Client State:** Zustand (dengan real-time Firestore `onSnapshot` listeners).

---

## 💻 Cara Menjalankan Proyek

### 1. Prasyarat Sistem
- Node.js versi `18.18+` atau `20+`
- Akun Google Firebase (dengan **Authentication** & **Cloud Firestore** aktif)
- Google AI Studio API Key (Gemini)

### 2. Kloning & Instalasi Dependensi
```bash
# Clone repository
git clone https://github.com/felichpehagasaginting-code/Felys.git
cd Felys

# Install paket dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root direktori dan sesuaikan kredensial:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Client Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Akses aplikasi melalui browser di **`http://localhost:3000`**.

### 5. Build Produksi
```bash
npm run build
npm run start
```

---

## 📚 Arsip Dokumentasi Proyek

| Dokumen | Deskripsi Ringkas |
| :--- | :--- |
| **[PRD.md](file:///f:/Projects/Felys/PRD.md)** | *Product Requirements Document*, persona pengguna, KPI, dan batasan scope. |
| **[ARCHITECTURE.md](file:///f:/Projects/Felys/ARCHITECTURE.md)** | Arsitektur teknis, domain service layer, dan diagram alur data Firebase. |
| **[DATABASE-SCHEMA.md](file:///f:/Projects/Felys/DATABASE-SCHEMA.md)** | Desain subkoleksi Firestore, skema dokumen, dan aturan keamanan (*Security Rules*). |
| **[AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md)** | Logika formula skor urgensi dan aturan trigger insight lintas mode. |
| **[API-SPEC.md](file:///f:/Projects/Felys/API-SPEC.md)** | Spesifikasi endpoint dan kontrak streaming AI chat. |
| **[ROADMAP.md](file:///f:/Projects/Felys/ROADMAP.md)** | Roadmap implementasi sprint dan tonggak pencapaian fitur. |
| **[UI.md](file:///f:/Projects/Felys/UI.md)** & **[UX.md](file:///f:/Projects/Felys/UX.md)** | Sistem desain warna pastel-pop, token antarmuka, dan user experience flow. |
| **[BRANDING.md](file:///f:/Projects/Felys/BRANDING.md)** | Panduan identitas brand, tone of voice, dan persona AI "Fio". |

---

<div align="center">

Dibuat dengan ❤️ untuk membantu mahasiswa menguasai waktu kuliah dan keuangan dengan tenang.

**Felys © 2026. All rights reserved.**

</div>
