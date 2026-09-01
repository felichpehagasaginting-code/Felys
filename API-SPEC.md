# API-SPEC.md — Felys API & Service Contracts Specification

Dokumen ini mendefinisikan seluruh kontrak **API Routes / Route Handlers** dan **Server Actions** di Felys, mencakup struktur request, response, error handling, dan interaksi dengan Firebase Admin SDK serta Google Gemini AI.

---

## 1. Konvensi Umum & Standar Komunikasi

- **Base URL:** `/api`
- **Format Data:** `application/json` (Kecuali AI streaming: `text/event-stream` / `text/plain`)
- **Autentikasi:** Menggunakan HTTP-only Session Cookie (`__session`) yang diverifikasi menggunakan Firebase Admin SDK (`admin.auth().verifySessionCookie()`).
- **Format Respons Sukses Standar:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Operasi berhasil"
  }
  ```
- **Format Respons Error Standar:**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST | UNAUTHORIZED | NOT_FOUND | INTERNAL_ERROR",
      "message": "Deskripsi pesan error ramah pengguna",
      "details": []
    }
  }
  ```

---

## 2. Authentication & User Profile API

### 2.1 Buat Session Cookie
- **Endpoint:** `POST /api/auth/session`
- **Deskripsi:** Menukarkan Firebase ID Token dari Client SDK menjadi HTTP-only session cookie setelah login berhasil.
- **Request Body:**
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Session berhasil dibuat"
  }
  ```

### 2.2 Logout & Revoke Session
- **Endpoint:** `DELETE /api/auth/session`
- **Response (200 OK):** Menghapus cookie `__session` dan merevoke token sesi.

---

## 3. Academic Mode API (Task & Course Management)

### 3.1 Course Endpoints

#### `GET /api/academic/courses`
- **Deskripsi:** Mengambil semua mata kuliah milik user.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "crs_123",
        "name": "Struktur Data",
        "color": "#B69CFF",
        "sks": 3,
        "createdAt": "2026-09-01T10:00:00.000Z"
      }
    ]
  }
  ```

#### `POST /api/academic/courses`
- **Request Body:**
  ```json
  {
    "name": "Kalkulus II",
    "color": "#7C5CFA",
    "sks": 3
  }
  ```

---

### 3.2 Task Endpoints

#### `GET /api/academic/tasks`
- **Query Params:**
  - `status`: `"todo"` | `"in_progress"` | `"done"` | `"all"`
  - `courseId`: string (opsional)
  - `view`: `"list"` | `"calendar"`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "tsk_001",
        "title": "Tugas Makalah Algoritma",
        "courseId": "crs_123",
        "courseName": "Struktur Data",
        "courseColor": "#B69CFF",
        "description": "Bab 1 sampai 3 format PDF",
        "deadline": "2026-09-05T23:59:00.000Z",
        "priority": "high",
        "estimatedHours": 4,
        "status": "todo",
        "urgencyScore": 88.0,
        "manualOrder": null,
        "completedSubtasksCount": 0,
        "totalSubtasksCount": 3
      }
    ]
  }
  ```

#### `POST /api/academic/tasks`
- **Deskripsi:** Membuat tugas baru dan otomatis menghitung `urgencyScore`.
- **Request Body:**
  ```json
  {
    "title": "Laporan Praktikum 2",
    "courseId": "crs_123",
    "deadline": "2026-09-03T17:00:00.000Z",
    "priority": "high",
    "estimatedHours": 3,
    "description": "Lengkap dengan flowchart"
  }
  ```
- **Response (201 Created):** Objek `Task` yang baru dibuat dengan `urgencyScore` terkomputasi.

#### `PATCH /api/academic/tasks/:id`
- **Request Body (Partial):**
  ```json
  {
    "status": "in_progress",
    "manualOrder": 1
  }
  ```

#### `DELETE /api/academic/tasks/:id`
- **Response (200 OK):** Menghapus tugas dan subkoleksi subtasks terkait.

---

## 4. Finance Mode API (Transactions & Budgets)

### 4.1 Category Endpoints

#### `GET /api/finance/categories`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cat_makan",
        "name": "Makan & Minum",
        "icon": "utensils",
        "color": "#7FE3C0",
        "isEssential": true,
        "isDefault": true
      },
      {
        "id": "cat_hiburan",
        "name": "Hiburan & Nongkrong",
        "icon": "gamepad-2",
        "color": "#FFC978",
        "isEssential": false,
        "isDefault": true
      }
    ]
  }
  ```

---

### 4.2 Transaction Endpoints

#### `GET /api/finance/transactions`
- **Query Params:**
  - `month`: `1-12`
  - `year`: `2026`
  - `type`: `"expense"` | `"income"` | `"all"`
  - `categoryId`: string (opsional)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "trx_999",
        "type": "expense",
        "amount": 35000,
        "categoryId": "cat_makan",
        "categoryName": "Makan & Minum",
        "categoryIcon": "utensils",
        "categoryColor": "#7FE3C0",
        "note": "Makan siang kos",
        "date": "2026-09-01T12:30:00.000Z"
      }
    ]
  }
  ```

#### `POST /api/finance/transactions`
- **Deskripsi:** Mencatat transaksi baru & memperbarui `spentAmount` pada budget kategori secara atomik via Firestore Transaction.
- **Request Body:**
  ```json
  {
    "type": "expense",
    "amount": 45000,
    "categoryId": "cat_hiburan",
    "note": "Kopi & jajan sore",
    "date": "2026-09-01T16:00:00.000Z"
  }
  ```

---

### 4.3 Budget Endpoints

#### `GET /api/finance/budgets`
- **Query Params:** `month=9&year=2026`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalBudget": 2500000,
      "totalSpent": 1750000,
      "remaining": 750000,
      "categories": [
        {
          "budgetId": "2026_9_cat_hiburan",
          "categoryId": "cat_hiburan",
          "categoryName": "Hiburan & Nongkrong",
          "monthlyLimit": 400000,
          "spentAmount": 320000,
          "remainingAmount": 80000,
          "usedPercentage": 80.0,
          "status": "attention"
        }
      ]
    }
  }
  ```

#### `PUT /api/finance/budgets`
- **Deskripsi:** Menetapkan atau memperbarui limit anggaran bulanan untuk kategori tertentu.
- **Request Body:**
  ```json
  {
    "categoryId": "cat_hiburan",
    "monthlyLimit": 500000,
    "month": 9,
    "year": 2026
  }
  ```

---

## 5. AI Assistant & Insights API ("Fio")

### 5.1 Active Insights
- **Endpoint:** `GET /api/ai/insights`
- **Deskripsi:** Mengambil kartu rekomendasi aktif (Top Urgent Tasks, Budget Alerts, dan Cross-Mode Insight).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ins_cross_01",
        "type": "cross_mode",
        "title": "Fokus Deadline Minggu Ini",
        "content": "Minggu ini ada 3 deadline mepet (Struktur Data, Kalkulus). Budget Hiburan udah kepake 80%, coba direm dulu biar fokus ngerjain tugas 👀",
        "isDismissed": false,
        "createdAt": "2026-09-01T08:00:00.000Z"
      }
    ]
  }
  ```

### 5.2 Dismiss Insight
- **Endpoint:** `PATCH /api/ai/insights/:id/dismiss`
- **Response (200 OK):** Mengubah `isDismissed` menjadi `true`.

### 5.3 Streaming AI Chat ("Fio")
- **Endpoint:** `POST /api/ai/chat`
- **Headers:** `Content-Type: application/json`, `Accept: text/event-stream`
- **Deskripsi:** Streaming response interaktif via Vercel AI SDK dengan Gemini 1.5/2.5 Flash yang di-inject ringkasan data tugas & keuangan pengguna saat itu.
- **Request Body:**
  ```json
  {
    "messages": [
      {
        "role": "user",
        "content": "Boleh ga aku nongkrong malam ini?"
      }
    ]
  }
  ```
- **Response:** Data stream (*Server-Sent Events*) dengan persona santai, suportif, dan ringkas.

---

## 6. Referensi Dokumen Terkait

- **Arsitektur Sistem:** [ARCHITECTURE.md](file:///f:/Projects/Felys/ARCHITECTURE.md)
- **Database Schema (Firestore):** [DATABASE-SCHEMA.md](file:///f:/Projects/Felys/DATABASE-SCHEMA.md)
- **Algoritma AI Logic:** [AI-LOGIC.md](file:///f:/Projects/Felys/AI-LOGIC.md)
- **Product Requirements:** [PRD.md](file:///f:/Projects/Felys/PRD.md)
