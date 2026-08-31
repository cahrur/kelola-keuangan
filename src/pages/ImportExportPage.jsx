import { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, FileDown, CircleCheckBig, CircleAlert } from 'lucide-react';
import useTransactionStore from '../stores/transactionStore';
import useCategoryStore from '../stores/categoryStore';
import useWalletStore from '../stores/walletStore';
import { toRows, buildCsv, buildExcel, parseFile, buildTemplateRows } from '../utils/transactionFile';
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

    const fileRef = useRef(null);
    const [parsedRows, setParsedRows] = useState(null);
    const [fileName, setFileName] = useState('');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [result, setResult] = useState(null);

    const handleExport = async () => {
        setExportError('');
        setSavedAt('');
        setExporting(true);
        try {
            const rows = toRows(transactions, { getCategoryById, getWalletById });
            const config = FORMATS[format];
            const data = format === 'excel' ? await buildExcel(rows) : buildCsv(rows);

            const location = await saveFile(data, `transaksi-${todayStamp()}.${config.extension}`, config.mime);
            setSavedAt(location ? `Tersimpan di ${location}` : '');
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
            const location = await saveFile(csv, 'template-impor-transaksi.csv', FORMATS.csv.mime);
            setImportError('');
            setSavedAt(location ? `Template tersimpan di ${location}` : '');
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
                    Simpan {transactions.length} transaksi ke berkas. Kategori dan kantong
                    ditulis sebagai nama, jadi berkasnya bisa dibaca akun lain.
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
                    disabled={exporting || transactions.length === 0}
                    icon={<Download size={16} />}
                >
                    {exporting ? 'Menyiapkan...' : `Ekspor ${FORMATS[format].label}`}
                </Button>
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
