<div align="center">

# ✨ Felys (AI Assistant: "Fio")

**"Atur waktu, atur uang, tenang aja."**

*Platform produktivitas akademik & manajemen keuangan mahasiswa terintegrasi berbasis Contextual AI.*

[![Next.js](https://img.shields.io/badge/Next.js-15.5_(App_Router)-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_SDK-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

[Fitur Utama](#-fitur-unggulan) • [Arsitektur](#-arsitektur--tech-stack) • [Formula AI](#-ai-engine--urgency-scoring) • [Panduan Instalasi](#-cara-menjalankan-proyek) • [Dokumentasi](#-arsip-dokumentasi)

</div>

---

## 🌟 Sekilas Tentang Felys

Sebagai mahasiswa, dua beban terbesar dalam keseharian adalah **deadline tugas kuliah yang menumpuk** dan **keuangan/uang saku yang cepat habis**. Seringkali aplikasi pencatat tugas dan aplikasi keuangan terpisah, sehingga mahasiswa tidak menyadari korelasi bahwa saat deadline menumpuk, pengeluaran impulsif untuk kopi, jajan, dan nongkrong ikut melonjak.

**Felys** hadir sebagai solusi all-in-one dengan **Dual-Mode System** (*Mode Akademik* & *Mode Keuangan*) yang disatukan oleh asisten AI pintar bernama **Fio**.

---

## 🚀 Fitur Unggulan

### 🎓 1. Mode Akademik (Lavender Pop `#B69CFF`)
- **Urgency Scoring Engine Otomatis:** Menghitung skor urgensi setiap tugas secara matematis (0 - 100) berdasarkan sisa waktu deadline, tingkat prioritas, dan estimasi jam pengerjaan.
- **Daftar Tugas & Checklist Sub-tasks:** Cicil tugas besar menjadi langkah-langkah kecil dengan indikator progres visual dan selebrasi konfeti saat tugas tuntas.
- **Kalender Deadline Interaktif:** Visualisasi titik warna tugas berdasarkan mata kuliah untuk memetakan beban belajar bulanan.
- **Manajemen Mata Kuliah:** Kelola SKS, tag warna kustom, dan monitoring tugas aktif per mata kuliah.

### 💸 2. Mode Keuangan (Mint Pop `#7FE3C0`)
- **Numpad Quick Entry (Zero-Friction):** Catat transaksi dalam hitungan detik dengan tombol instan `+000`, backspace, dan grid kategori 1-tap.
- **18 Kategori Mahasiswa Lengkap:** 
  - *Pengeluaran:* Makan & Minum, Transportasi, Kebutuhan Kuliah, Tagihan & Kos, Hiburan, Kopi & Jajan, Belanja, Kesehatan, Pulsa/Langganan, dan Lainnya.
  - *Pemasukan:* Uang Saku & Ortu, Gaji/Part-time, Beasiswa, Freelance/Projek, Jualan/Usaha, Hadiah/Bonus, Investasi/Cashback, dan Lainnya.
- **Batas Anggaran Progresif:** Indikator visual real-time dengan 4 level status:
  - 🟢 **Aman** ($< 70\%$)
  - 🟡 **Perhatian** ($70\% - 89\%$)
  - 🟠 **Warning** ($90\% - 99\%$)
  - 🔴 **Overbudget** ($\ge 100\%$)
- **Laporan & Distribusi Pengeluaran:** Ringkasan pemasukan, pengeluaran, tabungan bersih (*net savings*), dan diagram donat proporsi pengeluaran.

### 🤖 3. Engine Asisten AI "Fio" & Insight Lintas Mode
- **Insight Lintas Mode (Cross-Mode Heuristics):** Mendeteksi otomatis saat pengguna memiliki $\ge 2$ deadline mendesak ($\le 7$ hari) dan pengeluaran non-esensial sudah $\ge 70\%$, lalu memberikan saran solutif (misal: ajakan ngerjain tugas di kos sambil seduh kopi hemat).
- **Streaming Chat Drawer:** Obrolan interaktif real-time ditenagai **Google Gemini API** yang membaca data tugas dan kondisi budget pengguna secara kontekstual dengan tone santai dan suportif.

### 🔄 4. Dual-Mode Switcher & UI Modern
- Toggle persisten dengan animasi geser mulus (*Framer Motion spring*).
- Responsif penuh untuk desktop, tablet, dan smartphone dengan Bottom Navigation & Floating Action Button (FAB).
- Cloud Firestore Real-time Sync + Google One-Tap & Email Authentication.

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
├── src/
│   ├── app/                    # Next.js 15 App Router (Pages, API Routes, Layouts)
│   │   ├── (auth)/             # Authentication Routes (/login, /register)
│   │   ├── (dashboard)/        # Unified Dashboard, Academic, Finance, & Settings
│   │   └── api/ai/chat/        # Streaming Route handler ke Google Gemini API
│   ├── components/             # Reusable UI Components & Modals
│   │   ├── academic/           # TaskCard, TaskFormModal, CourseModal
│   │   ├── finance/            # NumpadQuickEntry, BudgetProgressBar, DonutExpenseChart
│   │   ├── ai/                 # AIDrawer, InsightCard
│   │   ├── shared/             # Navbar, Sidebar, BottomNav, ModeSwitcher
│   │   └── ui/                 # Base Radix Primitives & Custom Buttons
│   ├── lib/                    # Firebase SDK (Client & Admin) & Formatting Utilities
│   ├── server/services/        # Domain Engine (Urgency, Budget, Insight Services)
│   ├── stores/                 # Zustand State Stores (Data, Mode, AI, Auth)
│   └── types/                  # TypeScript Data Models & Contracts
```

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI Primitives, Lucide React, Recharts.
- **Database & Auth:** Google Cloud Firestore (Subcollection architecture `/users/{userId}/...`), Firebase Authentication, Firebase Admin SDK.
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
git clone https://github.com/your-username/felys.git
cd felys

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

# Firebase Admin Service Account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
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

Spesifikasi teknis, rancangan UI/UX, dan panduan lengkap terdokumentasi dalam dokumen berikut:

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
