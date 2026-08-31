import { useState, useRef, useMemo } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, FileDown, CircleCheckBig, CircleAlert } from 'lucide-react';
import useTransactionStore from '../stores/transactionStore';
import useCategoryStore from '../stores/categoryStore';
import useWalletStore from '../stores/walletStore';
import {
    toRows, buildCsv, buildExcel, parseFile, buildTemplateRows,
    filterByPeriod, periodFileLabel, availableYears,
} from '../utils/transactionFile';
import { saveFile } from '../utils/saveFile';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';
import './ImportExportPage.css';

const FORMATS = {
    csv: {
        label: 'CSV',
        hint: 'Terbuka di Excel, Google Sheets, dan Numbers',
        extension: 'csv',
        mime: 'text/csv;charset=utf-8',
    },
    excel: {
        label: 'Excel',
        hint: 'Berkas .xlsx dengan kolom siap pakai',
        extension: 'xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
};

const PERIODS = [
    { key: 'all', label: 'Semua' },
    { key: 'year', label: 'Tahun' },
    { key: 'month', label: 'Bulan' },
    { key: 'range', label: 'Rentang' },
];

const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function todayStamp() {
    return new Date().toISOString().slice(0, 10);
}

export default function ImportExportPage() {
    const { transactions, importTransactions } = useTransactionStore();
    const { categories, getCategoryById } = useCategoryStore();
    const { wallets, getWalletById } = useWalletStore();

    const [format, setFormat] = useState('csv');
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');
    const [savedAt, setSavedAt] = useState('');

    const now = new Date();
    const [mode, setMode] = useState('all');
    const [year, setYear] = useState(String(now.getFullYear()));
    const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const period = { mode, year, month, from, to };
    const years = useMemo(() => availableYears(transactions), [transactions]);
    const selected = useMemo(() => filterByPeriod(transactions, period),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [transactions, mode, year, month, from, to]);

    const fileRef = useRef(null);
    const [parsedRows, setParsedRows] = useState(null);
    const [fileName, setFileName] = useState('');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [result, setResult] = useState(null);

    // Di Android berkas ditulis langsung ke folder Download dan diumumkan lewat
    // notifikasi yang bisa diketuk untuk membuka. Kalau notifikasinya dimatikan
    // pengguna, pesan di layar ini yang jadi satu-satunya konfirmasi — jadi
    // kalimatnya menyesuaikan, bukan menjanjikan notifikasi yang tak akan datang.
    const describeSaved = ({ location, notified }) => {
        if (!location) return '';
        return notified
            ? `Tersimpan di ${location}. Ketuk notifikasi untuk membuka.`
            : `Tersimpan di ${location}`;
    };

    const handleExport = async () => {
        setExportError('');
        setSavedAt('');
        setExporting(true);
        try {
            const rows = toRows(selected, { getCategoryById, getWalletById });
            const config = FORMATS[format];
            const data = format === 'excel' ? await buildExcel(rows) : buildCsv(rows);
            const label = periodFileLabel(period, todayStamp());

            setSavedAt(describeSaved(
                await saveFile(data, `transaksi-${label}.${config.extension}`, config.mime)
            ));
        } catch {
            setExportError('Gagal membuat berkas. Coba lagi.');
        } finally {
            setExporting(false);
        }
    };

    // Template selalu CSV: bisa disunting di Excel, Google Sheets, Numbers,
    // bahkan Notepad, tanpa memaksa pengguna memilih format lebih dulu.
    const handleTemplate = async () => {
        try {
            const csv = buildCsv(buildTemplateRows(categories, wallets));
            const saved = await saveFile(csv, 'template-impor-transaksi.csv', FORMATS.csv.mime);
            setImportError('');
            setSavedAt(saved.location ? `Template ${describeSaved(saved).toLowerCase()}` : '');
        } catch {
            setImportError('Gagal membuat template. Coba lagi.');
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError('');
        setResult(null);
        setParsedRows(null);
        setFileName(file.name);

        try {
            const rows = await parseFile(file);
            if (rows.length === 0) {
                setImportError('Berkas tidak berisi baris transaksi.');
                return;
            }
            setParsedRows(rows);
        } catch (err) {
            setImportError(err.message || 'Berkas tidak bisa dibaca.');
        } finally {
            // Supaya memilih berkas yang sama dua kali tetap memicu perubahan.
            event.target.value = '';
        }
    };

    const handleImport = async () => {
        setImportError('');
        setImporting(true);
        try {
            setResult(await importTransactions(parsedRows));
            setParsedRows(null);
        } catch (err) {
            setImportError(err.response?.data?.message || 'Gagal mengimpor. Coba lagi.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="page-container">
            <PageHeader title="Impor & Ekspor" />

            <Card className="io-section">
                <div className="io-section__header">
                    <Download size={18} />
                    <h2>Ekspor Transaksi</h2>
                </div>
                <p className="io-section__desc">
                    Kategori dan kantong ditulis sebagai nama, jadi berkasnya bisa
                    dibaca akun lain.
                </p>

                <div className="io-field">
                    <span className="io-field__label">Periode</span>
                    <div className="io-chips">
                        {PERIODS.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                className={`io-chip ${mode === p.key ? 'io-chip--active' : ''}`}
                                onClick={() => setMode(p.key)}
                                aria-pressed={mode === p.key}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {(mode === 'year' || mode === 'month') && (
                    <div className="io-period-inputs">
                        {mode === 'month' && (
                            <label className="io-input">
                                <span>Bulan</span>
                                <select value={month} onChange={(e) => setMonth(e.target.value)}>
                                    {MONTHS.map((name, i) => (
                                        <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label className="io-input">
                            <span>Tahun</span>
                            <select value={year} onChange={(e) => setYear(e.target.value)}>
                                {(years.length > 0 ? years : [String(now.getFullYear())]).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}

                {mode === 'range' && (
                    <div className="io-period-inputs">
                        <label className="io-input">
                            <span>Dari</span>
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                        </label>
                        <label className="io-input">
                            <span>Sampai</span>
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                        </label>
                    </div>
                )}

                <p className="io-count">
                    {selected.length} dari {transactions.length} transaksi akan diekspor
                </p>

                <div className="io-formats">
                    {Object.entries(FORMATS).map(([key, config]) => (
                        <button
                            key={key}
                            type="button"
                            className={`io-format ${format === key ? 'io-format--active' : ''}`}
                            onClick={() => setFormat(key)}
                            aria-pressed={format === key}
                        >
                            {key === 'excel' ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                            <span className="io-format__label">{config.label}</span>
                            <span className="io-format__hint">{config.hint}</span>
                        </button>
                    ))}
                </div>

                {savedAt && <p className="io-message io-message--ok"><CircleCheckBig size={16} /> {savedAt}</p>}
                {exportError && <p className="io-message io-message--error">{exportError}</p>}

                <Button
                    fullWidth
                    onClick={handleExport}
                    disabled={exporting || selected.length === 0}
                    icon={<Download size={16} />}
                >
                    {exporting ? 'Menyiapkan...' : `Ekspor ${FORMATS[format].label}`}
                </Button>

                {selected.length === 0 && transactions.length > 0 && (
                    <p className="io-message io-message--warn">
                        <CircleAlert size={16} /> Tidak ada transaksi pada periode ini.
                    </p>
                )}
            </Card>

            <Card className="io-section">
                <div className="io-section__header">
                    <Upload size={18} />
                    <h2>Impor Transaksi</h2>
                </div>
                <p className="io-section__desc">
                    Pilih berkas CSV atau Excel. Kolom wajib: Tipe, Jumlah, Deskripsi,
                    Kategori, Tanggal. Kolom Kantong opsional.
                </p>

                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,text/csv"
                    onChange={handleFileChange}
                    hidden
                />

                <div className="io-actions">
                    <Button
                        fullWidth
                        variant="ghost"
                        onClick={handleTemplate}
                        icon={<FileDown size={16} />}
                    >
                        Unduh Template
                    </Button>
                    <Button
                        fullWidth
                        variant="secondary"
                        onClick={() => fileRef.current?.click()}
                        icon={<Upload size={16} />}
                    >
                        Pilih Berkas
                    </Button>
                </div>

                {fileName && <p className="io-message">{fileName}</p>}

                {parsedRows && (
                    <>
                        <p className="io-message io-message--ready">
                            {parsedRows.length} baris siap diimpor. Baris yang tidak valid akan dilewati.
                        </p>
                        <Button fullWidth onClick={handleImport} disabled={importing}>
                            {importing ? 'Mengimpor...' : `Impor ${parsedRows.length} Transaksi`}
                        </Button>
                    </>
                )}

                {importError && <p className="io-message io-message--error">{importError}</p>}

                {result && (
                    <div className="io-result">
                        <p className="io-message io-message--ok">
                            <CircleCheckBig size={16} /> {result.imported} transaksi berhasil diimpor
                        </p>

                        {result.skipped > 0 && (
                            <>
                                <p className="io-message io-message--warn">
                                    <CircleAlert size={16} /> {result.skipped} baris dilewati
                                </p>
                                <ul className="io-errors">
                                    {result.errors?.slice(0, 10).map((item) => (
                                        <li key={item.row}>Baris {item.row}: {item.reason}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
