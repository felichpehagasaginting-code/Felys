# DATABASE-SCHEMA.md — Felys Firebase Firestore Data Model

Dokumen ini mendefinisikan struktur database **Cloud Firestore (NoSQL Document Store)** untuk Felys, mencakup struktur koleksi (*collections*), dokumen (*documents*), tipe data, indeks komposit, dan aturan keamanan (*Security Rules*).

---

## 1. Collection Architecture Overview

Data diorganisasikan menggunakan pola **User-Scoped Subcollections** untuk menjamin isolasi multi-tenant yang kuat, performa query cepat, dan aturan keamanan (*Security Rules*) yang sederhana:

```
firestore/
├── users/{userId}                                # Dokumen User Profil & Settings
│   ├── courses/{courseId}                        # Subkoleksi Mata Kuliah
│   ├── tasks/{taskId}                            # Subkoleksi Tugas
│   │   └── subtasks/{subtaskId}                  # Sub-koleksi Checklist per Tugas
│   ├── categories/{categoryId}                   # Subkoleksi Kategori Finance
│   ├── transactions/{transactionId}              # Subkoleksi Catatan Transaksi
│   ├── budgets/{budgetId}                        # Subkoleksi Budget (ID: {year}_{month}_{categoryId})
│   └── ai_insights/{insightId}                   # Subkoleksi Rekomendasi & Alert AI
```

---

## 2. Collection & Document Specifications

### 2.1 Collection: `users`
- **Path:** `/users/{userId}` (`userId` adalah UID dari Firebase Auth)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Nama lengkap pengguna |
| `email` | `string` | Email pengguna |
| `photoURL` | `string \| null` | URL avatar profil |
| `activeMode` | `string` | Mode terakhir: `"academic"` atau `"finance"` (default: `"academic"`) |
| `theme` | `string` | `"light"` atau `"dark"` (default: `"light"`) |
| `createdAt` | `timestamp` | Server timestamp pembuatan akun |
| `updatedAt` | `timestamp` | Server timestamp pembaruan profil |

---

### 2.2 Subcollection: `courses` (Mata Kuliah)
- **Path:** `/users/{userId}/courses/{courseId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Nama mata kuliah (contoh: "Struktur Data") |
| `color` | `string` | Kode HEX warna untuk tagging visual (contoh: `"#B69CFF"`) |
| `sks` | `number \| null` | Bobot SKS (opsional, untuk pembobotan prioritas) |
| `createdAt` | `timestamp` | Waktu dibuat |
| `updatedAt` | `timestamp` | Waktu diperbarui |

---

### 2.3 Subcollection: `tasks` (Manajemen Tugas)
- **Path:** `/users/{userId}/tasks/{taskId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Judul/nama tugas |
| `courseId` | `string` | ID relasi ke `/courses/{courseId}` |
| `courseName` | `string` | *Denormalized* nama mata kuliah untuk query cepat |
| `courseColor` | `string` | *Denormalized* warna mata kuliah |
| `description` | `string \| null` | Deskripsi atau catatan detail tugas |
| `deadline` | `timestamp` | Waktu tenggat pengumpulan tugas |
| `priority` | `string` | Enum: `"low"` \| `"medium"` \| `"high"` (default: `"medium"`) |
| `estimatedHours` | `number \| null` | Estimasi jam pengerjaan |
| `status` | `string` | Enum: `"todo"` \| `"in_progress"` \| `"done"` (default: `"todo"`) |
| `urgencyScore` | `number` | Nilai urgensi terkomputasi (0 - 100), di-cache untuk sorting instan |
| `manualOrder` | `number \| null` | Urutan manual jika user melakukan drag & drop override |
| `completedSubtasksCount` | `number` | Cache jumlah sub-task yang selesai |
| `totalSubtasksCount` | `number` | Cache total sub-task |
| `createdAt` | `timestamp` | Waktu dibuat |
| `updatedAt` | `timestamp` | Waktu diperbarui |

#### Nested Subcollection: `subtasks`
- **Path:** `/users/{userId}/tasks/{taskId}/subtasks/{subtaskId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Nama sub-tugas |
| `isDone` | `boolean` | Status penyelesaian (default: `false`) |
| `order` | `number` | Urutan tampilan sub-tugas |
| `createdAt` | `timestamp` | Waktu dibuat |

---

### 2.4 Subcollection: `categories` (Kategori Finansial)
- **Path:** `/users/{userId}/categories/{categoryId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Nama kategori (contoh: "Makan & Minum", "Transport") |
| `icon` | `string` | Identifier ikon Lucide (contoh: `"utensils"`, `"bus"`) |
| `color` | `string` | Kode HEX warna kategori |
| `isEssential` | `boolean` | `true` jika esensial (Makan, Kos), `false` jika non-esensial (Hiburan, Belanja) |
| `isDefault` | `boolean` | Menandakan kategori bawaan sistem saat registrasi |
| `createdAt` | `timestamp` | Waktu dibuat |

---

### 2.5 Subcollection: `transactions` (Pencatatan Keuangan)
- **Path:** `/users/{userId}/transactions/{transactionId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | Enum: `"expense"` \| `"income"` |
| `amount` | `number` | Nominal transaksi dalam IDR (integer bulat atau 2 desimal) |
| `categoryId` | `string` | ID relasi ke `/categories/{categoryId}` |
| `categoryName` | `string` | *Denormalized* nama kategori untuk rendering cepat |
| `categoryIcon` | `string` | *Denormalized* ikon kategori |
| `categoryColor` | `string` | *Denormalized* warna kategori |
| `note` | `string \| null` | Catatan/keterangan transaksi |
| `date` | `timestamp` | Tanggal transaksi dilakukan |
| `createdAt` | `timestamp` | Waktu data dicatat ke sistem |

---

### 2.6 Subcollection: `budgets` (Alokasi Anggaran Bulanan)
- **Path:** `/users/{userId}/budgets/{budgetId}`
- **Format ID Dokumen:** `{year}_{month}_{categoryId}` (Contoh: `2026_9_cat123`) untuk menjamin keunikan per bulan.

| Field | Type | Description |
| :--- | :--- | :--- |
| `categoryId` | `string` | ID kategori |
| `monthlyLimit` | `number` | Batas maksimal pengeluaran bulanan (IDR) |
| `month` | `number` | Bulan (1 - 12) |
| `year` | `number` | Tahun (contoh: 2026) |
| `spentAmount` | `number` | Aggregated cache total pengeluaran kategori bulan ini |
| `status` | `string` | Enum: `"safe"` (<70%) \| `"attention"` (70-89%) \| `"warning"` (90-99%) \| `"overbudget"` (≥100%) |
| `updatedAt` | `timestamp` | Waktu agregasi terakhir dihitung |

---

### 2.7 Subcollection: `ai_insights` (Rekomendasi Cerdas & Alert)
- **Path:** `/users/{userId}/ai_insights/{insightId}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | Enum: `"task_recommendation"` \| `"budget_alert"` \| `"cross_mode"` |
| `title` | `string` | Judul singkat kartu insight |
| `content` | `string` | Pesan rekomendasi dengan gaya bahasa "Fio" |
| `relatedTaskId` | `string \| null` | ID tugas terkait (jika ada) |
| `relatedCategoryId` | `string \| null` | ID kategori terkait (jika ada) |
| `isDismissed` | `boolean` | Menandakan apakah user telah mengabaikan kartu ini (default: `false`) |
| `createdAt` | `timestamp` | Waktu insight digenerate |
| `expiresAt` | `timestamp` | Waktu kedaluwarsa kartu insight (TTL 24 jam) |

---

## 3. Firestore Composite Indexes

Daftar *Composite Indexes* yang wajib dikonfigurasikan di Firebase console (`firestore.indexes.json`):

1. **Urgent Tasks Dashboard:**
   - Collection: `tasks`
   - Fields: `status` (ASC), `urgencyScore` (DESC), `deadline` (ASC)
2. **Transaction History & Filter:**
   - Collection: `transactions`
   - Fields: `date` (DESC), `type` (ASC)
3. **Active AI Insights:**
   - Collection: `ai_insights`
   - Fields: `isDismissed` (ASC), `createdAt` (DESC)

---

## 4. Firebase Security Rules (`firestore.rules`)

Aturan keamanan berbasis otentikasi ketat agar user hanya bisa membaca dan memanipulasi datanya sendiri:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: cek apakah user sudah login dan mengakses datanya sendiri
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // User Profile Document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Subcollections di dalam user
      match /courses/{courseId} {
        allow read, write: if isOwner(userId);
      }

      match /tasks/{taskId} {
        allow read, write: if isOwner(userId);
        
        match /subtasks/{subtaskId} {
          allow read, write: if isOwner(userId);
        }
      }

      match /categories/{categoryId} {
        allow read, write: if isOwner(userId);
      }

      match /transactions/{transactionId} {
        allow read, write: if isOwner(userId);
      }

      match /budgets/{budgetId} {
        allow read, write: if isOwner(userId);
      }

      match /ai_insights/{insightId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## 5. Catatan Desain Data & Sinkronisasi

1. **Denormalisasi Terkendali:** Nama & warna mata kuliah serta kategori di-denormalisasi ke dalam dokumen `tasks` dan `transactions` untuk menghindari query berulang (*reads optimization*).
2. **Atomic Updates & Batch Writes:** Pembuatan transaksi baru menggunakan Firestore `batch` atau `runTransaction` untuk sekaligus meng-update `spentAmount` pada dokumen `budgets` terkait secara atomik.
3. **Kategori Default Saat Pendaftaran:** Saat user pertama kali register via Firebase Auth, Cloud Function / Server Action memicu pembuatan 7 kategori bawaan di subkoleksi `/users/{userId}/categories`.
