/**
 * Membaca dan menulis berkas transaksi (CSV dan Excel).
 *
 * Kolom sengaja memakai **nama** kategori dan kantong, bukan id. Berkas yang
 * diekspor dari satu akun harus bisa diimpor ke akun lain, dan di sana id yang
 * sama menunjuk ke kategori yang berbeda.
 *
 * CSV-nya juga yang menjawab kebutuhan "spreadsheet": Google Sheets, LibreOffice,
 * dan Numbers semuanya membuka dan menyimpan format ini tanpa perantara.
 */

// U+FEFF ditulis sebagai escape agar tidak terbaca sebagai spasi tak lazim.
const BOM = '﻿';

export const COLUMNS = ['type', 'amount', 'description', 'category', 'wallet', 'date'];

const HEADERS = ['Tipe', 'Jumlah', 'Deskripsi', 'Kategori', 'Kantong', 'Tanggal'];

// Excel menafsirkan sel yang diawali = + - @ sebagai rumus. Nilai seperti itu
// diawali kutip tunggal supaya tetap terbaca sebagai teks — mencegah formula
// injection saat berkas dibuka orang lain.
function neutralizeFormula(value) {
    const text = String(value ?? '');
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function csvCell(value) {
    const text = neutralizeFormula(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Ubah transaksi menjadi baris siap tulis, memakai nama kategori dan kantong. */
export function toRows(transactions, { getCategoryById, getWalletById }) {
    return transactions.map((txn) => ({
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        category: getCategoryById(txn.categoryId)?.name || '',
        wallet: getWalletById(txn.walletId)?.name || '',
        date: txn.date,
    }));
}

export function buildCsv(rows) {
    const lines = [HEADERS.join(',')];
    for (const row of rows) {
        lines.push(COLUMNS.map((key) => csvCell(row[key])).join(','));
    }
    // BOM supaya Excel di Windows membaca huruf beraksen dengan benar.
    return BOM + lines.join('\r\n');
}

// Header dicocokkan longgar: berkas bisa saja berasal dari ekspor kami (bahasa
// Indonesia) atau disusun sendiri oleh pengguna dengan istilah Inggris.
const HEADER_ALIASES = {
    type: ['tipe', 'type', 'jenis'],
    amount: ['jumlah', 'amount', 'nominal'],
    description: ['deskripsi', 'description', 'keterangan'],
    category: ['kategori', 'category'],
    wallet: ['kantong', 'wallet', 'dompet'],
    date: ['tanggal', 'date'],
};

function mapHeaders(headerCells) {
    const normalized = headerCells.map((cell) => String(cell ?? '').trim().toLowerCase());
    const index = {};

    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
        const position = normalized.findIndex((cell) => aliases.includes(cell));
        if (position >= 0) index[key] = position;
    }
    return index;
}

function rowsFromGrid(grid) {
    if (grid.length < 2) return [];

    const index = mapHeaders(grid[0]);
    const missing = ['type', 'amount', 'description', 'category', 'date']
        .filter((key) => index[key] === undefined);

    if (missing.length > 0) {
        throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(', ')}`);
    }

    return grid.slice(1)
        .filter((cells) => cells.some((cell) => String(cell ?? '').trim() !== ''))
        .map((cells) => {
            const read = (key) => (index[key] === undefined ? '' : cells[index[key]]);
            return {
                type: String(read('type') ?? '').trim(),
                amount: parseAmount(read('amount')),
                description: String(read('description') ?? '').trim(),
                category: String(read('category') ?? '').trim(),
                wallet: String(read('wallet') ?? '').trim(),
                date: normalizeDate(read('date')),
            };
        });
}

// Menerima "15000", "15.000", "15,000", dan "Rp 15.000".
function parseAmount(value) {
    if (typeof value === 'number') return value;

    const digits = String(value ?? '').replace(/[^\d,.-]/g, '');
    if (digits === '') return 0;

    // Pemisah terakhir dianggap desimal hanya jika diikuti 1-2 angka.
    const decimalMatch = digits.match(/[.,](\d{1,2})$/);
    if (decimalMatch) {
        const whole = digits.slice(0, decimalMatch.index).replace(/[.,]/g, '');
        return Number(`${whole}.${decimalMatch[1]}`) || 0;
    }
    return Number(digits.replace(/[.,]/g, '')) || 0;
}

// Excel mengembalikan Date untuk sel bertipe tanggal; CSV memberi teks.
function normalizeDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const offset = value.getTime() - value.getTimezoneOffset() * 60000;
        return new Date(offset).toISOString().slice(0, 10);
    }

    const text = String(value ?? '').trim();
    const slashed = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (slashed) {
        const [, day, month, year] = slashed;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return text.slice(0, 10);
}

function splitCsvLine(line) {
    const cells = [];
    let cell = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quoted) {
            if (char === '"' && line[i + 1] === '"') { cell += '"'; i++; }
            else if (char === '"') quoted = false;
            else cell += char;
        } else if (char === '"') quoted = true;
        else if (char === ',') { cells.push(cell); cell = ''; }
        else cell += char;
    }
    cells.push(cell);
    // Kutip tunggal pelindung rumus dibuang saat dibaca kembali.
    return cells.map((c) => c.replace(/^'/, ''));
}

export async function parseFile(file) {
    const isExcel = /\.xlsx$/i.test(file.name);

    if (isExcel) {
        const readXlsxFile = (await import('read-excel-file/browser')).default;
        const hasil = await readXlsxFile(file);

        // Paket ini mengembalikan [{ sheet, data }], bukan larik dua dimensi.
        // Versi sebelumnya mengembalikan lariknya langsung, jadi keduanya
        // diterima agar impor tidak diam-diam rusak lagi saat paketnya naik versi.
        const grid = Array.isArray(hasil[0]) ? hasil : (hasil[0]?.data ?? []);
        return rowsFromGrid(grid);
    }

    const text = (await file.text()).replace(new RegExp('^' + BOM), '');
    const grid = text.split(/\r?\n/).filter((line) => line.trim() !== '').map(splitCsvLine);
    return rowsFromGrid(grid);
}

/**
 * Baris contoh untuk template impor.
 *
 * Contohnya memakai kategori dan kantong milik pengguna sendiri, bukan nama
 * karangan — supaya berkas yang diunduh langsung lolos validasi kalau pengguna
 * hanya mengganti angka dan keterangannya.
 */
export function buildTemplateRows(categories, wallets) {
    const expense = categories.find((c) => c.type === 'expense');
    const income = categories.find((c) => c.type === 'income');
    const wallet = wallets[0];
    const today = new Date().toISOString().slice(0, 10);

    return [
        {
            type: 'expense',
            amount: 25000,
            description: 'Contoh pengeluaran - hapus baris ini',
            category: expense?.name || 'Makanan',
            wallet: wallet?.name || '',
            date: today,
        },
        {
            type: 'income',
            amount: 500000,
            description: 'Contoh pemasukan - hapus baris ini',
            category: income?.name || 'Gaji',
            wallet: wallet?.name || '',
            date: today,
        },
    ];
}

/**
 * Menyaring transaksi menurut periode yang dipilih pengguna.
 *
 * Tanggal disimpan sebagai teks YYYY-MM-DD, yang urut secara leksikografis —
 * jadi perbandingan langsung sudah benar tanpa perlu mengurai ke objek Date,
 * dan tidak ada risiko pergeseran zona waktu.
 */
export function filterByPeriod(transactions, period) {
    const { mode, year, month, from, to } = period;

    if (mode === 'year') {
        return transactions.filter((t) => String(t.date).slice(0, 4) === year);
    }
    if (mode === 'month') {
        return transactions.filter((t) => String(t.date).slice(0, 7) === `${year}-${month}`);
    }
    if (mode === 'range') {
        if (!from || !to) return [];
        // Dibalik kalau pengguna mengisi terbalik, daripada mengembalikan kosong
        // tanpa penjelasan.
        const [awal, akhir] = from <= to ? [from, to] : [to, from];
        return transactions.filter((t) => t.date >= awal && t.date <= akhir);
    }
    return transactions;
}

/** Potongan nama berkas yang menjelaskan periodenya, supaya unduhan tidak tertukar. */
export function periodFileLabel(period, today) {
    const { mode, year, month, from, to } = period;

    if (mode === 'year') return year;
    if (mode === 'month') return `${year}-${month}`;
    if (mode === 'range' && from && to) {
        const [awal, akhir] = from <= to ? [from, to] : [to, from];
        return `${awal}_sd_${akhir}`;
    }
    return `semua-${today}`;
}

/** Tahun yang benar-benar punya transaksi, terbaru dulu. */
export function availableYears(transactions) {
    const years = new Set(transactions.map((t) => String(t.date).slice(0, 4)).filter(Boolean));
    return [...years].sort().reverse();
}
