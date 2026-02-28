# Kelola Keuangan — Aplikasi Pencatat Keuangan Pribadi

Aplikasi pencatatan keuangan pribadi yang modern, lengkap, dan mudah digunakan. Dibangun sebagai PWA (Progressive Web App) sehingga bisa di-install di HP dan digunakan offline.

## Features

- [x] Dashboard — ringkasan saldo, pemasukan, pengeluaran, chart tren bulanan, AI Insight
- [x] Transaksi — CRUD lengkap, filter tipe/kategori/tanggal, search
- [x] Kategori — kelola kategori pemasukan & pengeluaran dengan warna
- [x] Anggaran — budget bulanan per kategori, progress bar, status alert
- [x] Kantong — kelola dompet/rekening, transfer antar kantong
- [x] Hutang — catat hutang dan piutang, tracking pembayaran
- [x] Tanggungan — kelola tagihan berulang (bulanan/tahunan), checklist bayar
- [x] Laporan — chart pie (per kategori), bar chart (bulanan), ringkasan kantong/hutang/tanggungan
- [x] Pengaturan — mata uang, API settings, AI settings, export/import data, reset data
- [x] PWA — installable, mobile-first design
- [x] Data persistence — semua data tersimpan di localStorage

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| State | Zustand + persist middleware |
| Charts | Recharts |
| Icons | Lucide React |
| Date | date-fns |
| Styling | Vanilla CSS (Seafoam Green light theme) |

## Getting Started (Development)

### Prerequisites

- Node.js 20+

### Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd catat-keuangan

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Run development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Nama aplikasi | `CatatKeuangan` |
| `VITE_DEFAULT_CURRENCY` | Mata uang default | `IDR` |

## Production Deployment

### Build

```bash
npm run build
```

Output ada di folder `dist/`.

### Deploy ke Coolify

1. Push ke GitHub
2. Buat resource baru di Coolify (Static Site)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy

## License

MIT
