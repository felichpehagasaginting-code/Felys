# UI.md — Feluna Design System

> Catatan: nama app di dokumen ini pakai **Feluna** sebagai placeholder (dari eksplorasi nama sebelumnya). Tinggal find-replace kalau nama final beda.

## 1. Prinsip Desain

- **Minimalis Berkelas** — whitespace lega, elemen ga numpuk, setiap layar fokus ke 1 tujuan utama.
- **Pastel yang Pop** — warna dasar soft/pastel, tapi ada 1-2 warna aksen yang jenuh/bold buat CTA dan highlight penting. Kontras ini yang bikin kesan "eye-catchy" tanpa ninggalin kesan minimalis.
- **Playful tapi Rapi** — rounded corners, micro-interaction halus, ilustrasi/emoji sedikit (bukan corporate/kaku), tapi grid dan alignment tetap presisi.
- **Dua Mode, Satu Identitas** — Mode Akademik dan Mode Finance punya aksen warna beda, tapi struktur, tipografi, dan komponen tetap konsisten biar ga berasa app yang beda.

## 2. Palet Warna

### Base (dipakai di kedua mode)

| Token | Hex | Fungsi |
| --- | --- | --- |
| `--bg-primary` | `#FAF9FC` | Background utama |
| `--bg-surface` | `#FFFFFF` | Card, panel |
| `--text-primary` | `#2D2A32` | Teks utama |
| `--text-secondary` | `#8A8593` | Teks sekunder/caption |
| `--border-soft` | `#EDEAF2` | Divider, border tipis |

### Aksen Mode Akademik — "Lavender Pop"

| Token | Hex | Fungsi |
| --- | --- | --- |
| `--accent-academic` | `#B69CFF` | Primary button, active tab |
| `--accent-academic-soft` | `#EDE5FF` | Background chip/badge |
| `--accent-academic-deep` | `#7C5CFA` | Hover/pressed state |

### Aksen Mode Finance — "Mint Pop"

| Token | Hex | Fungsi |
| --- | --- | --- |
| `--accent-finance` | `#7FE3C0` | Primary button, active tab |
| `--accent-finance-soft` | `#E0FBF2` | Background chip/badge |
| `--accent-finance-deep` | `#37B98F` | Hover/pressed state |

### Status & Semantic

| Token | Hex | Fungsi |
| --- | --- | --- |
| `--status-urgent` | `#FF7A85` (coral pastel) | Deadline mepet, overbudget |
| `--status-warning` | `#FFC978` (peach) | Mendekati limit/deadline |
| `--status-success` | `#7FE3C0` | Selesai, on-track |
| `--status-info` | `#8EC8FF` | Insight AI netral |

> Aturan: 1 layar maksimal pakai 1 warna aksen mode + 1 warna status. Jangan overload warna — biar tetap "pop" bukan "rame".

## 3. Tipografi

- **Font:** `Plus Jakarta Sans` atau `Inter` (fallback: system-ui). Kedua font ini modern, rounded-friendly, gampang dibaca di ukuran kecil.
- **Skala:**
  - Display (judul dashboard): 32px / bold
  - H1 (judul halaman): 24px / semibold
  - H2 (judul section): 18px / semibold
  - Body: 15px / regular
  - Caption/meta: 13px / regular, warna `--text-secondary`
- **Line-height:** 1.5 buat body, 1.2 buat heading.

## 4. Komponen Utama

### Mode Switcher

- Toggle pill di navbar atas (bukan dropdown), 2 opsi berdampingan dengan slider animasi.
- Warna aktif ikut aksen mode yang lagi dipilih (lavender/mint).

### Card (Task Card & Transaction Card)

- Rounded corner 16px, shadow halus (`0 2px 12px rgba(0,0,0,0.04)`), padding 16-20px.
- Task card: badge prioritas warna kiri (coral/peach/mint sesuai urgensi), nama tugas bold, mata kuliah + deadline sebagai caption.
- Transaction card: ikon kategori bulat pastel di kiri, nominal di kanan (merah soft untuk keluar, hijau soft untuk masuk).

### Button

- Primary: solid aksen mode, rounded-full atau rounded-xl (12px), teks putih.
- Secondary: outline tipis, background transparan.
- Ghost/text button buat aksi sekunder (skip, batal).

### AI Assistant Bubble

- Floating card di pojok bawah atau panel slide-in dari kanan, background gradient soft (lavender→mint tipis) buat nunjukkin dia "menghubungkan" dua mode.
- Avatar/icon AI kecil, bulat, konsisten di semua touchpoint.

### Chart (Finance Mode)

- Pie/donut chart pakai palet pastel kategori (jangan warna default library yang tajam) — tone-nya harus align sama palet di atas.
- Line chart trend pakai gradient area fill tipis di bawah garis, bukan solid.

## 5. Spacing & Grid

- Base unit: 4px. Spacing umum: 8, 12, 16, 24, 32, 48px.
- Container max-width dashboard: 1200px, dengan sidebar 240px (desktop) / bottom nav (mobile).
- Border radius konsisten: 12px (button/input kecil), 16px (card), 24px (modal/panel besar).

## 6. Iconography & Ilustrasi

- Icon set: `Lucide` atau `Phosphor Icons` (rounded/duotone style, bukan sharp/outline tajam) — selaras sama vibe soft-pop.
- Ilustrasi kosong-state (empty state) pakai gaya flat-pastel simpel, bukan foto realistis.

## 7. Dark Mode (opsional, rekomendasi ada)

- Background: `#1C1A22`, surface: `#26232E`, aksen tetap sama tapi sedikit di-desaturate 10% biar ga terlalu neon di background gelap.

## 8. Referensi Visual (vibe check)

- Layout & whitespace: Linear, Notion
- Warna pastel-pop & playful card: Duolingo (tapi lebih kalem), Cash App
- Chart minimalis: Tremor.so
