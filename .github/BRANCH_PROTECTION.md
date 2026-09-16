# 🛡️ Panduan Mengaktifkan Branch Protection di GitHub (1 Menit)

Untuk menjaga branch `main` selalu stabil, aman, dan hanya menerima kode yang telah lulus seluruh pengujian otomatis (CI), ikuti langkah cepat berikut di repository GitHub kamu:

---

### 1. Buka Menu Aturan Branch
1. Buka repo **Felys** di [github.com/felichpehagasaginting-code/Felys](https://github.com/felichpehagasaginting-code/Felys).
2. Klik tab **Settings** (di sebelah kanan atas repository).
3. Di bilah samping kiri, pilih menu **Branches** (atau **Rules** > **Rulesets**).

---

### 2. Tambahkan Aturan untuk Branch `main`
1. Klik tombol **Add branch protection rule** (atau *New ruleset*).
2. Pada kolom **Branch name pattern**, ketik:
   ```
   main
   ```

---

### 3. Centang 3 Opsi Proteksi Utama:
- ✅ **Require a pull request before merging**
  *(Mencegah push langsung ke main; perubahan harus melalui pull request dari branch testing)*.
- ✅ **Require status checks to pass before merging**
  *(Pilih check yang wajib lulus:*
  - `Type Check (TypeScript)`
  - `Unit Tests (Vitest)`
  - `Production Build (Next.js)`
- ✅ **Do not allow bypassing the above settings**
  *(Mencegah force-push secara tidak sengaja)*.

---

### 4. Simpan Perubahan
Klik tombol hijau **Create** / **Save changes** di bagian paling bawah.

> [!TIP]
> Sekarang repository Felys kamu sudah berstandar industri! Setiap kali ada kode baru di branch `testing`, GitHub akan memastikan 100% test lulus sebelum kode bisa masuk ke `main`.
