# Kelola Keuangan — Aplikasi Pengelola Keuangan Pribadi

Aplikasi pengelola keuangan pribadi yang modern dan lengkap. Full-stack: React frontend + Golang backend, autentikasi JWT + Google OAuth, semua data per-user di PostgreSQL, deploy jadi 1 container di Coolify.

## Features

### 🔐 Autentikasi
- [x] Login & Register dengan email + password
- [x] Login dengan Google OAuth (langsung masuk tanpa tanya nomor WA untuk akun yang sudah terdaftar)
- [x] Register dengan Google OAuth + input nomor WhatsApp
- [x] JWT access token + refresh token
- [x] Auto-refresh token saat expired
- [x] Lupa Password — reset via email OTP (6 digit, berlaku 5 menit)

### 📊 Dashboard
- [x] Ringkasan saldo total dari semua kantong
- [x] Total pemasukan & pengeluaran bulan ini
- [x] Chart tren bulanan (bar chart Pemasukan vs Pengeluaran)
- [x] Daftar transaksi terbaru
- [x] AI Insight — saran cerdas berdasarkan data keuangan

### 🤖 AI Asisten
- [x] Chat interaktif dengan AI yang memahami data keuanganmu
- [x] AI membaca data Transaksi, Kantong, Hutang, Tanggungan, Anggaran, dan Kategori
- [x] Dibatasi hanya topik keuangan — tidak bisa ditanya hal lain
- [x] Session/riwayat chat tersimpan di database
- [x] AI menggunakan nama fitur aplikasi (Kantong, Anggaran, dll) bukan istilah generik
- [x] Konfigurasi AI kustom: Base URL, API Key, Model, Custom Prompt
- [x] API Key user dienkripsi dengan AES-256-GCM sebelum disimpan di database
- [x] Kompatibel dengan OpenAI API dan semua provider OpenAI-compatible
- [x] Default config dari env server, bisa di-override per user di Setelan

### 💸 Transaksi
- [x] CRUD lengkap (tambah, edit, hapus)
- [x] Tipe: Pemasukan & Pengeluaran
- [x] Filter berdasarkan tipe, kategori, tanggal
- [x] Pencarian berdasarkan deskripsi/jumlah
- [x] Input nominal otomatis format Rupiah (10000 → 10.000)

### 🏷️ Kategori
- [x] Kelola kategori pemasukan & pengeluaran
- [x] Pilih warna kustom untuk setiap kategori
- [x] Ikon berdasarkan huruf pertama nama kategori

### 📋 Anggaran (Budget)
- [x] Budget bulanan per kategori pengeluaran
- [x] Progress bar visual penggunaan budget
- [x] Status alert: Aman / Hampir / Melebihi
- [x] Ringkasan total anggaran vs total terpakai
- [x] Filter bulan & tahun

### 👛 Kantong (Wallet)
- [x] Kelola dompet / rekening / kantong uang
- [x] Transfer antar kantong
- [x] Sesuaikan saldo (tambah / kurangi)
- [x] Total saldo dari semua kantong
- [x] Warna kustom untuk setiap kantong
- [x] Input nominal otomatis format Rupiah

### 🤝 Hutang & Piutang
- [x] Catat hutang saya (i_owe) & piutang orang (they_owe)
- [x] Pembayaran parsial (cicilan) dengan tracking progress
- [x] Tandai lunas langsung
- [x] Progress bar sisa hutang/piutang
- [x] Tanggal jatuh tempo (opsional)
- [x] Input nominal otomatis format Rupiah

### 📅 Tanggungan (Kewajiban Rutin)
- [x] Catat tagihan berulang: bulanan atau tahunan
- [x] Checklist bayar per periode
- [x] Catat otomatis ke transaksi pengeluaran saat dicentang
- [x] Progress pembayaran (berapa periode terbayar)
- [x] Tanggal mulai & selesai (opsional, bisa selamanya)
- [x] Input nominal otomatis format Rupiah

### 📈 Laporan
- [x] Chart tren bulanan (bar chart Pemasukan vs Pengeluaran per bulan)
- [x] Pie chart breakdown per kategori (Pemasukan / Pengeluaran)
- [x] **Trend Pemasukan** — line chart harian per kategori, filter bulan/tahun
- [x] **Trend Pengeluaran** — line chart harian per kategori, filter bulan/tahun
- [x] **Trend Tanggungan** — riwayat pembayaran per tanggungan (12 periode terakhir)
- [x] Ringkasan kantong (total saldo + detail per kantong)
- [x] Ringkasan hutang & piutang (total + jumlah aktif)
- [x] Ringkasan tanggungan (est. pengeluaran bulanan + daftar tanggungan)

### ⚙️ Pengaturan
- [x] Pilih mata uang (IDR, USD, EUR)
- [x] Konfigurasi AI kustom (Base URL, API Key, Model, Custom Prompt)
- [x] API Key dienkripsi AES-256-GCM sebelum disimpan, di-mask saat ditampilkan

### 🎨 UI/UX
- [x] Mobile-first responsive design
- [x] Dark theme modern
- [x] Navigasi bottom bar
- [x] Smooth animations & transitions
- [x] Input nominal auto-format Rupiah di semua field uang
- [x] Empty state dengan ilustrasi untuk halaman kosong

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | React 19 + Vite         |
| Backend   | Golang (Gin + GORM)     |
| Database  | PostgreSQL              |
| Auth      | JWT + bcrypt + Google OAuth |
| State     | Zustand                 |
| Charts    | Recharts                |
| Deploy    | Docker + Coolify        |

## Getting Started (Development)

### Prerequisites

- Node.js 20+
- Go 1.22+
- PostgreSQL

### Setup Frontend

```bash
cd catat-keuangan
cp .env.example .env
npm install
npm run dev
```

### Setup Backend

```bash
cd catat-keuangan/backend
cp .env.example .env
# Edit .env: isi DB_PASS, JWT_SECRET, GOOGLE_CLIENT_ID, TURNSTILE_SECRET_KEY (opsional)
go run ./cmd/server
```

### Environment Variables

#### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (opsional) | - |
| `VITE_DEFAULT_CURRENCY` | Mata uang default | `IDR` |

#### Backend (backend/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_PORT` | Server port | `8000` |
| `APP_ENV` | Environment (`development` / `production`) | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `catat_keuangan` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASS` | Database password | - |
| `JWT_SECRET` | JWT signing key (min 32 karakter) | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `BCRYPT_ROUNDS` | Bcrypt cost | `12` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (opsional) | - |
| `AI_BASE_URL` | OpenAI-compatible API base URL | - |
| `AI_API_KEY` | API key untuk AI provider | - |
| `AI_MODEL` | Model AI yang digunakan | `gpt-4o-mini` |
| `ENCRYPTION_KEY` | Key untuk enkripsi AES-256 (harus 32 karakter) | - |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username/email | - |
| `SMTP_PASS` | SMTP password / app password | - |
| `SMTP_FROM` | Alamat pengirim email | - |

---

## Production Deployment (Coolify)

### 1. Build Binary di Lokal

Go binary di-build di lokal, **bukan di server**. Setelah build, commit & push binary ke GitHub.

**PowerShell (Windows):**
```powershell
cd backend
$env:GOOS="linux"; $env:GOARCH="amd64"; go build -o server-backend ./cmd/server; $env:GOOS=""; $env:GOARCH=""
```

**Bash (Linux/Mac):**
```bash
cd backend
GOOS=linux GOARCH=amd64 go build -o server-backend ./cmd/server
```

### 2. Push ke GitHub

```bash
git add .
git commit -m "build: update binary"
git push
```

### 3. Setup di Coolify

#### Resource yang dibutuhkan:
- **1 Docker App** — point ke repo GitHub, Dockerfile sudah di root
- **1 PostgreSQL** — buat via Coolify

#### Environment Variables di Coolify:

Masukkan lewat **Coolify Dashboard → Configuration → Environment Variables** (format key-value):

```
APP_PORT=8000
APP_ENV=production

DB_HOST=<internal-postgres-host>
DB_PORT=5432
DB_NAME=catat_keuangan
DB_USER=postgres
DB_PASS=<password-postgres-coolify>

JWT_SECRET=<random-string-min-32-karakter>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12

CORS_ORIGINS=https://yourdomain.com

GOOGLE_CLIENT_ID=<google-client-id>.apps.googleusercontent.com
TURNSTILE_SITE_KEY=<turnstile-site-key>
TURNSTILE_SECRET_KEY=<turnstile-secret-key>

AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=<your-ai-api-key>
AI_MODEL=deepseek/deepseek-v3.2

ENCRYPTION_KEY=<random-string-wajib-32-karakter>

SMTP_HOST=smtp.larksuite.com
SMTP_PORT=587
SMTP_USER=noreply-kk@mudahdeal.com
SMTP_PASS=<smtp-password>
SMTP_FROM=noreply-kk@mudahdeal.com
```

> **Catatan:**
> - `GOOGLE_CLIENT_ID` cukup **1 kali** saja. Dockerfile otomatis meneruskannya ke frontend (sebagai `VITE_GOOGLE_CLIENT_ID`) saat build, dan backend membacanya saat runtime. Pastikan di Coolify, `GOOGLE_CLIENT_ID` di-set sebagai **Build Variable** (bukan hanya runtime) supaya Vite bisa membacanya saat `npm run build`.
> - Jika pakai Cloudflare Turnstile, isi `TURNSTILE_SECRET_KEY` di runtime env backend dan `TURNSTILE_SITE_KEY` di Build Variable agar frontend menghasilkan `VITE_TURNSTILE_SITE_KEY` saat build.
> - `SMTP_*` dibutuhkan untuk fitur **Lupa Password** (kirim OTP via email). Jika tidak diisi, fitur reset password tidak akan berfungsi.
> - `ENCRYPTION_KEY` harus tepat **32 karakter** untuk enkripsi AES-256-GCM (API key AI user).

#### Port di Coolify:
- **Ports Exposes**: `8000`
- **Domains**: `https://yourdomain.com`

### 4. Deploy

Push ke GitHub → Coolify auto-deploy. Done! 🎉

### Health Check

```
GET /health → 200 OK
```

---

## 📱 Build Aplikasi Android (APK / Play Store)

Versi Android dibungkus dengan **Capacitor**: kode React yang sama persis dijalankan
di dalam WebView native, jadi desainnya identik dengan versi web. Yang berbeda hanya
cangkangnya — ada launcher icon, tombol back Android, dan **tidak ada
service worker/PWA** (manifest & Workbox hanya ikut di build web).

### Prerequisites

- **JDK 17+** — paling praktis pakai yang dibundel Android Studio
- **Android SDK** dengan platform `android-35` (atau lebih baru) + build-tools

Gradle mencari JDK lewat `JAVA_HOME`, jadi set sekali (PowerShell):

```powershell
[Environment]::SetEnvironmentVariable(
  "JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```

Lalu beri tahu Gradle lokasi SDK lewat `android/local.properties`:

```properties
sdk.dir=C\:/Users/<user>/AppData/Local/Android/Sdk
```

> File ini berformat Java properties, jadi backslash adalah escape character.
> Pakai forward slash seperti di atas — `sdk.dir=C:\Users\...` akan terbaca
> rusak dan Gradle gagal dengan *"The filename, directory name, or volume label
> syntax is incorrect"*. Kalau project dibuka lewat Android Studio, file ini
> dibuat otomatis.

### 1. Konfigurasi

```bash
cp .env.native.example .env.native
```

Build web dilayani satu origin dengan API-nya (`VITE_API_URL` kosong), tapi APK
berjalan di origin `https://localhost`. Jadi di `.env.native`, `VITE_API_URL`
**wajib absolut** ke domain produksi.

### 2. Build APK debug (instal manual / testing)

```bash
npm run android:apk
```

Hasilnya di `android/app/build/outputs/apk/debug/app-debug.apk` — salin ke HP dan
install (perlu mengaktifkan "Install unknown apps").

### 3. Build AAB release (Play Store)

Play Store hanya menerima bundle yang ditandatangani. Buat keystore **satu kali**
lalu simpan baik-baik: kalau hilang, aplikasi di Play Store tidak bisa di-update lagi.

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v `
  -keystore kelola-keuangan.jks -keyalg RSA -keysize 2048 -validity 10000 `
  -alias kelola-keuangan
```

Buat `android/keystore.properties` (sudah masuk `.gitignore`):

```properties
storeFile=../../kelola-keuangan.jks
storePassword=isi-password-keystore
keyAlias=kelola-keuangan
keyPassword=isi-password-key
```

```bash
npm run android:aab
```

Hasilnya di `android/app/build/outputs/bundle/release/app-release.aab`. Tanpa
`keystore.properties`, build release tetap jalan tapi bundle-nya tidak
ditandatangani dan akan ditolak Play Store.

### Daftar script

| Script | Fungsi |
|---|---|
| `npm run build:native` | Build web assets mode native (tanpa PWA, API absolut) |
| `npm run android:sync` | `build:native` + salin assets ke project Android |
| `npm run android:open` | Sync lalu buka project di Android Studio |
| `npm run android:apk` | Sync lalu build APK debug |
| `npm run android:aab` | Sync lalu build AAB release |

### Catatan penting

**Login Google di aplikasi memakai jalur berbeda dari web.** Google Identity
Services menolak dirender di dalam WebView (`disallowed_useragent`), jadi build
native memakai `@capgo/capacitor-social-login` yang menjalankan **Google
Credential Manager** — pemilih akun native. Keduanya menghasilkan ID token dengan
`aud` yang sama (Web Client ID), sehingga `google_auth.go` menerima keduanya
tanpa perubahan apa pun di backend. Komponennya satu: `GoogleAuthButton.jsx`
memilih jalur berdasarkan `isNative`.

Agar jalan, Google Cloud Console butuh **OAuth client bertipe Android** di project
yang sama dengan Web client, berisi package name `com.mudahdeal.kk`
dan SHA-1 sertifikat penandatangan. Client Android itu tidak dipakai di kode —
keberadaannya saja yang menjadi izin Google menerbitkan token ke aplikasi ini.
Ambil SHA-1 debug dengan:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -list -v `
  -keystore "$env:USERPROFILE\.android\debug.keystore" `
  -alias androiddebugkey -storepass android
```

Untuk rilis, daftarkan **satu client Android lagi**. Kalau memakai Play App
Signing (default untuk AAB), SHA-1 yang benar ada di **Play Console → App
integrity → App signing key certificate**, bukan dari keystore lokal — Google
menandatangani ulang aplikasinya. Salah ambil di sini membuat login Google gagal
dengan `DEVELOPER_ERROR` hanya di versi Play Store, sementara build debug lancar.

**Backend wajib di-redeploy sebelum APK bisa login.** Dari sudut pandang WebView,
API berada di origin berbeda, jadi:

- `config.Load()` selalu menambahkan `https://localhost` ke daftar CORS
- cookie `refreshToken` dikirim dengan `SameSite=None; Secure` saat `APP_ENV=production`
  (lihat `backend/internal/handler/cookie.go`)

**Turnstile harus diizinkan untuk hostname `localhost`.** Kalau backend produksi
punya `TURNSTILE_SECRET_KEY`, login akan ditolak bila token captcha kosong. Jadi
isi `VITE_TURNSTILE_SITE_KEY` di `.env.native`, lalu tambahkan hostname
`localhost` pada Hostname Management widget Turnstile di dashboard Cloudflare —
di dalam APK halaman berjalan di `https://localhost`.

**Splash sistem sengaja dibuat tidak terlihat.** Sejak Android 12, platform selalu
menampilkan splash sendiri dan itu tidak bisa dimatikan. Kalau dibiarkan default,
logo muncul dua kali: sekali dari sistem, sekali lagi dari `SplashScreen.jsx`. Jadi
di `values-v31/styles.xml` latarnya disamakan dengan gradient gelap `SplashScreen.css`
(`@color/splashBackground`) dan ikonnya diganti drawable transparan
(`@drawable/splash_icon_none`), sehingga perpindahannya tidak terlihat. Jangan
mengembalikan `windowSplashScreenAnimatedIcon` ke launcher icon kecuali splash React
di aplikasinya ikut dihapus.

**Update aplikasi.** APK yang diinstal manual tidak punya auto-update — setiap rilis
baru harus dikirim ulang. Lewat Play Store, update ditangani Play. Naikkan
`versionCode`/`versionName` di `android/app/build.gradle` sebelum rilis.

## API Documentation

Base URL: `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register (name, email, phone, password) |
| `POST` | `/auth/login` | Login (email, password) |
| `POST` | `/auth/google` | Google OAuth login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/me` | Get current user profile |
| `POST` | `/auth/forgot-password` | Kirim OTP ke email |
| `POST` | `/auth/verify-otp` | Verifikasi kode OTP |
| `POST` | `/auth/reset-password` | Reset password dengan OTP |
| `GET` | `/transactions` | List transactions |
| `POST` | `/transactions` | Create transaction |
| `PUT` | `/transactions/:id` | Update transaction |
| `DELETE` | `/transactions/:id` | Delete transaction |
| `GET` | `/categories` | List categories |
| `GET` | `/wallets` | List wallets |
| `GET` | `/debts` | List debts |
| `GET` | `/obligations` | List obligations |
| `GET` | `/budgets` | List budgets |
| `GET` | `/health` | Health check |

## 🌐 Akses Aplikasi

Aplikasi ini tersedia dan bisa digunakan di **[kelola-keuangan.mudahdeal.com](https://kelola-keuangan.mudahdeal.com/)**

## ☁️ Hosting

Proyek ini di-host menggunakan **[DealCloud](https://cloud.mudahdeal.com)** — Deploy App Instan seperti Vercel.

## 👨‍💻 Developer

Dikembangkan oleh:
- **[Cahrur Rozid](https://github.com/cahrur)**
- **[DealTech](https://github.com/Deal-Tech)** — [tech.mudahdeal.com](https://tech.mudahdeal.com)
- **[Claude Opus](https://claude.ai)** — AI Developer by Anthropic

## 🐛 Kontribusi & Laporan Bug

Jika kamu ingin **request fitur baru**, **menemukan bug**, atau **menemukan celah keamanan**, silakan buat issue di:

👉 [**github.com/cahrur/kelola-keuangan/issues**](https://github.com/cahrur/kelola-keuangan/issues)

## 📄 License

Proyek ini bersifat **open source** dan dilisensikan di bawah [MIT License](LICENSE).
