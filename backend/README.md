# Catat Keuangan — Backend API

Backend REST API untuk aplikasi Catat Keuangan, dibangun dengan Go + Gin + GORM + PostgreSQL.

## Features

- [x] Auth — register, login (JWT), refresh token rotation, logout
- [x] Transactions — CRUD dengan filter (type, category, date range)
- [x] Categories — CRUD (income/expense categories)
- [x] Wallets — CRUD (kantong/rekening)
- [x] Debts — CRUD (hutang/piutang)
- [x] Obligations — CRUD + checklist (tanggungan bulanan/tahunan)
- [x] Health check endpoint
- [x] Auto-migration on startup

## Tech Stack

| Layer      | Technology           |
|------------|----------------------|
| Language   | Go 1.22+             |
| Framework  | Gin                  |
| ORM        | GORM                 |
| Database   | PostgreSQL           |
| Auth       | JWT + bcrypt         |
| Deploy     | Docker + Coolify     |

## Getting Started (Development)

### Prerequisites

- Go 1.22+
- PostgreSQL

### Setup

```bash
# 1. Clone repository
cd backend

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your database credentials

# 4. Install dependencies
go mod download

# 5. Run development server
go run ./cmd/server
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_PORT` | Server port | `8000` |
| `APP_ENV` | Environment (development/production) | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `catat_keuangan` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASS` | Database password | - |
| `JWT_SECRET` | JWT signing key (min 32 chars) | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `BCRYPT_ROUNDS` | Bcrypt hashing rounds | `12` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |

## Production Deployment

### Build (Lokal)

```bash
GOOS=linux GOARCH=amd64 go build -o server_binary ./cmd/server
```

### Deploy ke Coolify

1. Push ke GitHub (dengan `server_binary`)
2. Buat resource baru di Coolify
3. Set environment variables di Coolify Dashboard
4. Deploy

### Health Check

```
GET /health → 200 OK
```

## API Documentation

Base URL: `/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Register |
| `POST` | `/auth/login` | No | Login |
| `POST` | `/auth/refresh` | Cookie | Refresh token |
| `POST` | `/auth/logout` | Yes | Logout |
| `GET` | `/auth/me` | Yes | Current user |
| `GET` | `/transactions` | Yes | List transactions |
| `POST` | `/transactions` | Yes | Create transaction |
| `PUT` | `/transactions/:id` | Yes | Update transaction |
| `DELETE` | `/transactions/:id` | Yes | Delete transaction |
| `GET` | `/categories` | Yes | List categories |
| `POST` | `/categories` | Yes | Create category |
| `PUT` | `/categories/:id` | Yes | Update category |
| `DELETE` | `/categories/:id` | Yes | Delete category |
| `GET` | `/wallets` | Yes | List wallets |
| `POST` | `/wallets` | Yes | Create wallet |
| `PUT` | `/wallets/:id` | Yes | Update wallet |
| `DELETE` | `/wallets/:id` | Yes | Delete wallet |
| `GET` | `/debts` | Yes | List debts |
| `POST` | `/debts` | Yes | Create debt |
| `PUT` | `/debts/:id` | Yes | Update debt |
| `DELETE` | `/debts/:id` | Yes | Delete debt |
| `GET` | `/obligations` | Yes | List obligations |
| `POST` | `/obligations` | Yes | Create obligation |
| `PUT` | `/obligations/:id` | Yes | Update obligation |
| `DELETE` | `/obligations/:id` | Yes | Delete obligation |
| `GET` | `/obligations/:id/checklist` | Yes | List checklist |
| `POST` | `/obligations/:id/checklist` | Yes | Toggle period |

## License

MIT
