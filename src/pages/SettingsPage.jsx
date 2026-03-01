import { useState } from 'react';
import { Globe, Sparkles, Eye, EyeOff } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';
import { CURRENCIES } from '../utils/constants';
import Card from '../components/ui/Card';
import './SettingsPage.css';

export default function SettingsPage() {
    const { currency, setCurrency, aiBaseUrl, setAiBaseUrl, aiApiKey, setAiApiKey, aiPrompt, setAiPrompt } = useSettingsStore();
    const [showAiKey, setShowAiKey] = useState(false);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Pengaturan</h1>
                <p className="page-subtitle">Atur preferensi aplikasi</p>
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

            {/* App Info */}
            <div className="app-info mt-lg">
                <p className="app-info__name">Kelola Keuangan</p>
                <p className="app-info__version">v1.0.0 — Aplikasi Pengelola Keuangan Pribadi</p>
            </div>
        </div>
    );
}
