import { useRef, useState } from 'react';
import { Download, Upload, Trash2, Globe, AlertTriangle, Server, ToggleLeft, ToggleRight, Eye, EyeOff, Copy, RefreshCw, Check, Sparkles } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';
import { CURRENCIES } from '../utils/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import './SettingsPage.css';

export default function SettingsPage() {
    const { currency, setCurrency, apiBaseUrl, apiKey, apiEnabled, setApiEnabled, regenerateApiKey, aiBaseUrl, setAiBaseUrl, aiApiKey, setAiApiKey, aiPrompt, setAiPrompt, exportData, importData, resetAllData } = useSettingsStore();
    const fileInputRef = useRef(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showAiKey, setShowAiKey] = useState(false);
    const [copiedField, setCopiedField] = useState('');

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                importData(ev.target.result);
                setImportStatus('success');
            } catch {
                setImportStatus('error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Pengaturan</h1>
                <p className="page-subtitle">Atur preferensi dan kelola data</p>
            </div>

            {/* Currency */}
            <Card className="settings-card mb-md animate-slide-up">
                <div className="settings-card__header">
                    <Globe size={18} className="settings-card__icon" />
                    <div>
                        <h3 className="settings-card__title">Mata Uang</h3>
                        <p className="settings-card__desc">Pilih mata uang yang ditampilkan</p>
                    </div>
                </div>
                <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-sm"
                >
                    {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.symbol} — {c.name} ({c.code})
                        </option>
                    ))}
                </select>
            </Card>

            {/* API Settings */}
            <Card className="settings-card mb-md animate-slide-up" style={{ animationDelay: '0.025s' }}>
                <div className="settings-card__header">
                    <Server size={18} className="settings-card__icon" />
                    <div>
                        <h3 className="settings-card__title">API Settings</h3>
                        <p className="settings-card__desc">Konfigurasi koneksi ke backend API</p>
                    </div>
                </div>

                <div className="api-toggle mt-md" onClick={() => setApiEnabled(!apiEnabled)}>
                    <div className="api-toggle__info">
                        <span className="api-toggle__label">Status API</span>
                        <span className={`api-toggle__status ${apiEnabled ? 'text-income' : 'text-muted'}`}>
                            {apiEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                    <button className={`api-toggle__btn ${apiEnabled ? 'api-toggle__btn--active' : ''}`}>
                        {apiEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                </div>

                <div className="form-group mt-md">
                    <label className="form-label">Base URL</label>
                    <div className="api-readonly-field">
                        <span className="api-readonly-field__value">{apiBaseUrl}</span>
                        <button
                            className="api-readonly-field__copy"
                            onClick={() => { navigator.clipboard.writeText(apiBaseUrl); setCopiedField('url'); setTimeout(() => setCopiedField(''), 1500); }}
                        >
                            {copiedField === 'url' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">API Key</label>
                    <div className="api-readonly-field">
                        <span className="api-readonly-field__value">
                            {showApiKey ? apiKey : '•'.repeat(20)}
                        </span>
                        <div className="api-readonly-field__actions">
                            <button onClick={() => setShowApiKey(!showApiKey)}>
                                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(apiKey); setCopiedField('key'); setTimeout(() => setCopiedField(''), 1500); }}>
                                {copiedField === 'key' ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    <button className="api-regenerate mt-sm" onClick={regenerateApiKey}>
                        <RefreshCw size={12} /> Generate Ulang API Key
                    </button>
                </div>
            </Card>

            {/* AI API Settings */}
            <Card className="settings-card mb-md animate-slide-up" style={{ animationDelay: '0.035s' }}>
                <div className="settings-card__header">
                    <Sparkles size={18} className="settings-card__icon" />
                    <div>
                        <h3 className="settings-card__title">AI Settings</h3>
                        <p className="settings-card__desc">Konfigurasi AI untuk saran keuangan otomatis</p>
                    </div>
                </div>

                <div className="form-group mt-md">
                    <label className="form-label">Base URL</label>
                    <input
                        type="url"
                        placeholder="https://api.openai.com/v1"
                        value={aiBaseUrl}
                        onChange={(e) => setAiBaseUrl(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">API Key</label>
                    <div className="api-key-input">
                        <input
                            type={showAiKey ? 'text' : 'password'}
                            placeholder="sk-xxxxxxxxxxxx"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                        />
                        <button
                            type="button"
                            className="api-key-toggle"
                            onClick={() => setShowAiKey(!showAiKey)}
                        >
                            {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Prompt</label>
                    <textarea
                        rows={3}
                        placeholder="Instruksi untuk AI..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                    />
                </div>
            </Card>

            {/* Export */}
            <Card className="settings-card mb-md animate-slide-up" style={{ animationDelay: '0.05s' }}>
                <div className="settings-card__header">
                    <Download size={18} className="settings-card__icon" />
                    <div>
                        <h3 className="settings-card__title">Ekspor Data</h3>
                        <p className="settings-card__desc">Unduh semua data sebagai file JSON</p>
                    </div>
                </div>
                <Button variant="secondary" fullWidth className="mt-sm" onClick={exportData} icon={<Download size={16} />}>
                    Ekspor Backup
                </Button>
            </Card>

            {/* Import */}
            <Card className="settings-card mb-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="settings-card__header">
                    <Upload size={18} className="settings-card__icon" />
                    <div>
                        <h3 className="settings-card__title">Impor Data</h3>
                        <p className="settings-card__desc">Pulihkan dari file backup JSON</p>
                    </div>
                </div>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleImport}
                    style={{ display: 'none' }}
                />
                <Button
                    variant="secondary"
                    fullWidth
                    className="mt-sm"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload size={16} />}
                >
                    Pilih File
                </Button>
                {importStatus === 'error' && (
                    <p className="text-expense mt-sm" style={{ fontSize: 'var(--font-xs)' }}>
                        ⚠️ File tidak valid. Pastikan menggunakan file backup yang benar.
                    </p>
                )}
            </Card>

            {/* Reset */}
            <Card className="settings-card settings-card--danger mb-md animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <div className="settings-card__header">
                    <Trash2 size={18} className="settings-card__icon" style={{ color: 'var(--color-danger)' }} />
                    <div>
                        <h3 className="settings-card__title" style={{ color: 'var(--color-danger)' }}>Reset Data</h3>
                        <p className="settings-card__desc">Hapus semua data dan kembali ke pengaturan awal. Tindakan ini tidak dapat dibatalkan!</p>
                    </div>
                </div>
                <Button variant="danger" fullWidth className="mt-sm" onClick={() => setShowResetConfirm(true)} icon={<Trash2 size={16} />}>
                    Reset Semua Data
                </Button>
            </Card>

            {/* App Info */}
            <div className="app-info mt-lg">
                <p className="app-info__name">Kelola Keuangan</p>
                <p className="app-info__version">v1.0.0 — Aplikasi Pencatat Keuangan Pribadi</p>
                <p className="app-info__credit">Data tersimpan di browser (localStorage)</p>
            </div>

            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={resetAllData}
                title="Reset Semua Data?"
                message="Semua transaksi, kategori, anggaran, dan pengaturan akan dihapus permanen. Pastikan sudah membuat backup sebelum mereset."
                confirmText="Reset"
            />
        </div>
    );
}
