# ARCHITECTURE.md — Felys Technical Architecture Specification

## 1. System Overview

Felys dibangun dengan arsitektur **Full-Stack Monolith modern** berbasis **Next.js 15 (App Router)**, **TypeScript**, dan **Firebase (Cloud Firestore & Firebase Authentication)**. Arsitektur ini menggabungkan kecepatan SSR/Server Actions Next.js dengan kapabilitas real-time, fleksibilitas NoSQL, dan keamanan *Rule-based* dari Firebase.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (Browser)                          │
│  - Next.js Client Components (React 19) + Firebase Client SDK              │
│  - Zustand (Client UI State: Active Mode, AI Drawer, Modal Form)            │
│  - Tailwind CSS v4 + Framer Motion (Smooth Lavender/Mint Mode Transitions)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON / SSE Streams / WebSockets
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    APPLICATION LAYER (Next.js App Router)                   │
│                                                                             │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐ │
│  │ Server Components /   │ │ Route Handlers /     │ │ Server Actions /   │ │
│  │ SSR Pages             │ │ REST Endpoints       │ │ Mutations          │ │
│  └───────────┬───────────┘ └──────────┬───────────┘ └─────────┬──────────┘ │
│              │                        │                       │            │
│  ┌───────────▼────────────────────────▼───────────────────────▼──────────┐ │
│  │                           DOMAIN SERVICES LAYER                       │ │
│  │  - AcademicUrgencyService (Formula w1/w2/w3 calculation & caching)    │ │
│  │  - FinanceBudgetService (Real-time spending vs limit aggregation)     │ │
│  │  - CrossModeAIEngine (Heuristic trigger + LLM Prompt Context Builder) │ │
│  │  - FirebaseAuthService (Session validation & token verification)      │ │
│  └────────────────────────────────────┬──────────────────────────────────┘ │
└───────────────────────────────────────┼────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┴───────────────────────────────┐
        │                                                               │
┌───────▼──────────────────────────────┐    ┌───────────────────────────▼────┐
│          DATA ACCESS LAYER           │    │       EXTERNAL SERVICES        │
│  - Firebase Admin SDK (Server-side)  │    │  - Google Gemini API / LLM     │
│  - Cloud Firestore (NoSQL DB)        │    │    (Streaming via AI SDK)      │
│  - Firebase Auth (Identity & OAuth)  │    │  - Google Cloud Scheduler      │
└──────────────────────────────────────┘    └────────────────────────────────┘
```

---

## 2. Technology Stack Selection

| Komponen / Lapisan | Teknologi yang Dipilih | Rationale & Justifikasi |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** + **React 19** | Hybrid rendering (Server Components untuk initial load cepat, Client Components untuk interaktivitas instan). |
| **Bahasa** | **TypeScript (Strict Mode)** | Menjamin konsistensi tipe data dari skema Firestore hingga komponen UI. |
| **Database** | **Google Cloud Firestore** | NoSQL document database terkelola, scalable, mendukung subcollections untuk isolasi data user, dan *real-time listener*. |
| **Authentication** | **Firebase Authentication** | Otentikasi siap pakai mendukung Email/Password, Google OAuth, session token verification via cookie, dan Security Rules. |
| **Backend & SDK** | **Firebase Admin SDK** (Server) + **Firebase JS SDK v11** (Client) | Manipulasi data aman di server actions/API routes dan listener real-time di client jika diperlukan. |
| **Styling & Design System** | **Tailwind CSS v4** + CSS Variables | Implementasi palet pastel-pop (Lavender & Mint) sesuai [UI.md](file:///f:/Projects/Felys/UI.md) dengan token variabel warna. |
| **UI Components & Icons** | **Radix UI Primitives** + **Lucide React** | Komponen aksesibel (WCAG AA), ringan, dan gaya ikon rounded-soft yang ramah. |
| **Micro-Interactions** | **Framer Motion** | Animasi halus saat switch mode (Lavender ↔ Mint), strikethrough checklist, dan count-up angka. |
| **State Management** | **Zustand** | Manajemen client state global yang ringan (active mode, drawer AI open/close, draft input). |
| **Form Handling & Validation** | **React Hook Form** + **Zod** | Validasi skema input (Task, Transaksi, Budget) yang sinkron di sisi client dan server. |
| **AI Integration & LLM** | **Vercel AI SDK** + **Google Gemini 1.5/2.5 Flash** | Latensi *Time-to-First-Token* sangat cepat (< 1.5 detik), biaya API efisien, dan native streaming. |

---

## 3. Directory & Folder Structure

Mengikuti konvensi modular Next.js App Router dengan Firebase:

```
felys/
├── firestore.rules                # Aturan keamanan Cloud Firestore
├── firestore.indexes.json         # Konfigurasi composite indexes Firestore
├── public/
│   ├── icons/                     # Favicon, PWA icons, kategori icons
│   └── illustrations/             # Empty state illustrations
├── src/
│   ├── app/                       # Next.js App Router (Pages & Layouts)
│   │   ├── (auth)/                # Route group untuk Auth (login, register)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/           # Route group aplikasi utama dengan sidebar/navbar
│   │   │   ├── layout.tsx         # Persistent Layout (Navbar, Mode Switcher, AI Drawer)
│   │   │   ├── page.tsx           # Unified Dashboard Home (Top Tasks + Budget + AI)
│   │   │   ├── academic/          # Mode Akademik
│   │   │   │   ├── page.tsx       # Task List View
│   │   │   │   ├── calendar/page.tsx
│   │   │   │   └── courses/page.tsx
│   │   │   ├── finance/           # Mode Finance
│   │   │   │   ├── page.tsx       # Transactions List & Numpad Quick Entry
│   │   │   │   ├── budget/page.tsx
│   │   │   │   └── reports/page.tsx
│   │   │   └── settings/page.tsx  # Profile, Category/Course Management, Theme
│   │   ├── api/                   # Route Handlers / API Endpoints
│   │   │   ├── auth/session/route.ts
│   │   │   ├── academic/tasks/route.ts
│   │   │   ├── academic/courses/route.ts
│   │   │   ├── finance/transactions/route.ts
│   │   │   ├── finance/budgets/route.ts
│   │   │   ├── ai/insights/route.ts
│   │   │   └── ai/chat/route.ts   # Streaming LLM endpoint
│   │   ├── globals.css            # Base styles, Tailwind directives & CSS tokens
│   │   └── layout.tsx             # Root layout (Fonts, Providers)
│   ├── components/                # Reusable UI Components
│   │   ├── ui/                    # Base UI (Button, Card, Input, Modal, Badge)
│   │   ├── shared/                # Navbar, Sidebar, ModeSwitcher, ModeThemeProvider
│   │   ├── academic/              # TaskCard, CourseBadge, TaskFormModal, UrgencyBadge
│   │   ├── finance/               # TransactionCard, NumpadInput, BudgetProgressBar, DonutChart
│   │   └── ai/                    # AIDrawer, InsightCard, CrossModeAlert, ChatMessage
│   ├── lib/                       # Utility & Shared Config
│   │   ├── firebase/
│   │   │   ├── client.ts          # Firebase JS SDK Client App Initialization
│   │   │   ├── admin.ts           # Firebase Admin SDK Initialization (Server-side)
│   │   │   └── auth-helpers.ts    # Get current session & verify ID tokens
│   │   ├── ai.ts                  # Gemini LLM Client & Prompts Configuration
│   │   └── utils.ts               # Formatting (Currency IDR, Date, CN helper)
│   ├── server/                    # Domain Logic & Services (Backend Pure Logic)
│   │   ├── services/
│   │   │   ├── urgency.service.ts # Implementasi formula Urgency Score (AI-LOGIC.md)
│   │   │   ├── budget.service.ts  # Perhitungan konsumsi budget & threshold
│   │   │   ├── insight.service.ts # Evaluator kondisi Cross-Mode & Task Recommendations
│   │   │   └── chat.service.ts    # Prompt context assembler untuk LLM Chat
│   │   └── actions/               # Server Actions untuk form mutations
│   ├── stores/                    # Zustand Stores
│   │   ├── use-mode-store.ts      # Active Mode: 'academic' | 'finance'
│   │   ├── use-auth-store.ts      # Auth user state di client
│   │   └── use-ai-store.ts        # AI Drawer open/close state & chat history
│   ├── types/                     # Shared TypeScript Definitions
│   │   ├── academic.ts
│   │   ├── finance.ts
│   │   ├── ai.ts
│   │   └── user.ts
│   └── middleware.ts              # Session verification & route protection
├── .env.example
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 4. Core Domain Engine Design

### 4.1 Academic Urgency Engine (`urgency.service.ts`)
Mengimplementasikan formula matematis di [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md#L9-L40):
- **Formula:** $urgencyScore = (0.5 \times deadlineFactor) + (0.3 \times priorityFactor) + (0.2 \times effortFactor)$
- **Mekanisme Eksekusi:**
  - **On-Write:** Dihitung saat task dibuat atau diperbarui, langsung disimpan pada field `urgencyScore` di `/users/{userId}/tasks/{taskId}`.
  - **Scheduled Recalculation:** Trigger harian jam 00:00 (via Cloud Function / Cron Endpoint) untuk memperbarui skor seluruh tugas aktif.

### 4.2 Finance Budget Engine (`budget.service.ts`)
- Saat transaksi *expense* baru dicatat, Server Action menggunakan `runTransaction` Firestore untuk menjamin pembaruan atomik:
  1. Menambah dokumen di `/users/{userId}/transactions/{transactionId}`.
  2. Mengakumulasi `spentAmount` di `/users/{userId}/budgets/{year}_{month}_{categoryId}`.
  3. Memperbarui status budget (`safe` / `attention` / `warning` / `overbudget`).

### 4.3 Cross-Mode Insight Engine (`insight.service.ts`)
- **Heuristic Condition Evaluator:**
  1. Memeriksa apakah ada $\ge 2$ task dengan `urgencyScore` $\ge 80$ dengan deadline $\le 7$ hari.
  2. Memeriksa apakah ada $\ge 1$ kategori non-esensial dengan pemakaian $\ge 70\%$.
- **Insight Generator & Caching:**
  - Menyimpan kartu di subkoleksi `/users/{userId}/ai_insights/{insightId}` dengan TTL kedaluwarsa 24 jam.

### 4.4 AI Streaming Context Engine (`chat.service.ts`)
- Saat chat dibuka, backend mengambil:
  - Top 5 tugas paling urgent dari `/users/{userId}/tasks` (diurutkan berdasarkan `urgencyScore` desc).
  - Ringkasan budget aktif dari `/users/{userId}/budgets` bulan berjalan.
- Context diinjeksikan ke System Prompt Google Gemini LLM melalui Vercel AI SDK dengan respons streaming.

---

## 5. Dual-Mode Theming Architecture

1. **Client State (Zustand + Cookies):**
   - State `activeMode` ('academic' | 'finance') disimpan di Zustand dan disinkronkan ke cookie `felys_active_mode` serta field `activeMode` di dokumen user Firestore.
2. **CSS Variables & Theme Switcher:**
   - Atribut `data-mode="academic"` atau `data-mode="finance"` dipasang pada wrapper elemen utama.
   - Variabel CSS dinamis otomatis berganti nilai antara `#B69CFF` (Lavender) dan `#7FE3C0` (Mint) dengan animasi transisi warna 300ms.

---

## 6. Security & Performance Strategy

1. **Firestore Security Rules:**
   - Seluruh akses subkoleksi dibatasi hanya untuk `request.auth.uid == userId`.
2. **Session Cookie Management:**
   - Token ID Firebase Auth ditukarkan menjadi HTTP-only session cookie untuk diverifikasi secara aman oleh middleware Next.js.
3. **Optimistic UI Updates:**
   - UI langsung memperbarui checklist dan transaksi secara instan sebelum respons server selesai.
4. **Rate Limiting LLM:**
   - Endpoint AI dibatasi maksimal 30 request/jam per user untuk menjaga efisiensi kuota dan biaya API.

---

## 7. Referensi Dokumen Terkait

- **Product Requirements:** [PRD.md](file:///f:/Projects/Felys/PRD.md)
- **Database Schema (Firestore):** [DATABASE-SCHEMA.md](file:///f:/Projects/Felys/DATABASE-SCHEMA.md)
- **AI Logic & Algoritma:** [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md)
- **Desain UI:** [UI.md](file:///f:/Projects/Felys/UI.md)
- **User Experience (UX):** [UX.md](file:///f:/Projects/Felys/UX.md)
