# Panduan Penggunaan & Build Native iOS — Felys 🍎📱

Felys telah dilengkapi dengan arsitektur **Native iOS Ready**, yang dapat dijalankan melalui **2 cara**:
1. **Cara 1: iOS PWA (Progressive Web App / Add to Home Screen)** — Paling mudah, instan, tanpa butuh Mac/Xcode.
2. **Cara 2: Native iOS Project (Xcode / Capacitor)** — Untuk di-build menjadi file `.ipa` dan diunggah ke Apple App Store / TestFlight.

---

## 🌟 Cara 1: Menjalankan via iOS Safari (PWA Standalone)

Aplikasi Felys sudah memiliki Web App Manifest, Safe Area Insets (Dynamic Island / Notch & Home Indicator), serta touch behavior native iOS.

### Langkah-langkah di iPhone / iPad:
1. Buka browser **Safari** di iPhone Anda.
2. Buka URL web Felys (misal: `http://<IP_KOMPUTER_ANDA>:3000` atau URL hosting Vercel/Firebase Hosting).
3. Tap tombol **Share** (ikon kotak dengan panah ke atas di bagian bawah Safari).
4. Gulir ke bawah dan pilih **"Add to Home Screen"** (Tambah ke Layar Utama).
5. Beri nama **Felys**, lalu tap **Add**.
6. Ikon aplikasi Felys akan muncul di Home Screen iPhone Anda.
7. Saat dibuka, aplikasi akan berjalan **Full-screen Standalone (tanpa address bar Safari)**, dengan status bar transparan dan navigasi yang pas di atas Home Indicator iPhone!

---

## 🛠️ Cara 2: Build Native iOS Project via Xcode & Capacitor

Jika Anda ingin mengompilasi Felys menjadi aplikasi native iOS `.ipa` atau menjalankannya di Xcode Simulator:

### 1. Prasyarat:
- Komputer macOS dengan **Xcode** terpasang (versi 15+).
- **CocoaPods** terpasang (`sudo gem install cocoapods`).

### 2. Instalasi Dependensi Capacitor (di Terminal):
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

### 3. Generate Build Static Next.js:
Tambahkan `output: 'export'` di `next.config.mjs` jika ingin full static bundle, lalu jalankan:
```bash
npm run build
```

### 4. Tambahkan Platform iOS & Buka Xcode:
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

Xcode akan otomatis terbuka dengan workspace `ios/App/App.xcworkspace`.

### 5. Jalankan di iPhone / Simulator:
- Di Xcode, pilih perangkat target (misal: *iPhone 16 Pro Simulator* atau *iPhone fisik Anda*).
- Klik tombol **Run (▶)** di pojok kiri atas Xcode.
- Aplikasi Felys akan terinstal dan berjalan secara native di iOS!

---

## 🎨 Fitur Native iOS yang Sudah Terpasang:
- **Safe Area Insets:** Notch, Dynamic Island, dan garis Home Indicator tidak menutupi tombol/navigasi.
- **No Tap Highlight Box:** Menghilangkan kotak abu-abu saat tombol disentuh di Safari iOS.
- **Smooth Momentum Scrolling:** `-webkit-overflow-scrolling: touch` aktif di semua card dan dialog.
- **Standby & Memory Cleanup:** Store dibersihkan secara aman saat background/logout.
