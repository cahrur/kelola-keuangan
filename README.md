# Catat Keuangan — Aplikasi Pencatat Keuangan Pribadi

Aplikasi pencatatan keuangan pribadi yang modern dan lengkap. Full-stack: React frontend + Golang backend, autentikasi JWT + Google OAuth, semua data per-user di PostgreSQL, deploy jadi 1 container di Coolify.

## Features

- [x] Auth — Login/Register email+password, Google OAuth, JWT access+refresh token
- [x] Dashboard — ringkasan saldo, pemasukan, pengeluaran, chart tren bulanan
- [x] Transaksi — CRUD lengkap, filter tipe/kategori/tanggal, search
- [x] Kategori — kelola kategori pemasukan & pengeluaran dengan warna
- [x] Anggaran — budget bulanan per kategori, progress bar, status alert
- [x] Kantong — kelola dompet/rekening, transfer antar kantong
- [x] Hutang — catat hutang dan piutang, tracking pembayaran
- [x] Tanggungan — kelola tagihan berulang (bulanan/tahunan), checklist bayar
- [x] Laporan — chart pie (per kategori), bar chart (bulanan), ringkasan

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
# Edit .env: isi DB_PASS, JWT_SECRET, GOOGLE_CLIENT_ID
go run ./cmd/server
```

### Environment Variables

#### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
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
```

> **Catatan:** `GOOGLE_CLIENT_ID` cukup **1 kali** saja. Dockerfile otomatis meneruskannya ke frontend (sebagai `VITE_GOOGLE_CLIENT_ID`) saat build, dan backend membacanya saat runtime. Pastikan di Coolify, `GOOGLE_CLIENT_ID` di-set sebagai **Build Variable** (bukan hanya runtime) supaya Vite bisa membacanya saat `npm run build`.

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

## License

MIT
