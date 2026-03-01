import { useEffect, useState } from 'react';
import { Settings, DollarSign, Bot, Eye, EyeOff, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';
import useAIStore from '../stores/aiStore';
import PageHeader from '../components/layout/PageHeader';
import './SettingsPage.css';

export default function SettingsPage() {
    const { currency, setCurrency } = useSettingsStore();
    const { aiConfig, fetchAIConfig, updateAIConfig } = useAIStore();

    // AI config local state
    const [aiBaseUrl, setAiBaseUrl] = useState('');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiSaved, setAiSaved] = useState(false);
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        fetchAIConfig();
    }, [fetchAIConfig]);

    useEffect(() => {
        if (aiConfig) {
            setAiBaseUrl(aiConfig.base_url || '');
            setAiApiKey(''); // Never pre-fill API key
            setAiModel(aiConfig.model || '');
            setAiPrompt(aiConfig.custom_prompt || '');
        }
    }, [aiConfig]);

    const handleSaveAI = async () => {
        setAiSaving(true);
        setAiError('');
        setAiSaved(false);
        try {
            const payload = {
                base_url: aiBaseUrl,
                model: aiModel,
                custom_prompt: aiPrompt,
            };
            // Only send API key if user typed a new one
            if (aiApiKey) {
                payload.api_key = aiApiKey;
            }
            await updateAIConfig(payload);
            setAiSaved(true);
            setAiApiKey(''); // Clear after save
            setTimeout(() => setAiSaved(false), 3000);
        } catch (err) {
            setAiError(err.response?.data?.message || 'Gagal menyimpan konfigurasi AI');
        } finally {
            setAiSaving(false);
        }
    };

    return (
        <div className="page-container">
            <PageHeader title="Pengaturan" />

            {/* Currency */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <DollarSign size={18} />
                    <h2>Mata Uang</h2>
                </div>
                <div className="settings-section__content">
                    <div className="settings-field">
                        <label className="settings-field__label">Mata Uang Default</label>
                        <select
                            className="settings-field__input"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option value="IDR">IDR — Rupiah Indonesia</option>
                            <option value="USD">USD — US Dollar</option>
                            <option value="EUR">EUR — Euro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* AI Config */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <Bot size={18} />
                    <h2>Konfigurasi AI</h2>
                </div>
                <p className="settings-section__desc">
                    Konfigurasi AI kustom. Jika kosong, akan menggunakan konfigurasi default server.
                    API Key kamu dienkripsi (AES-256) sebelum disimpan.
                    {aiConfig?.api_key_masked && (
                        <span className="settings-field__hint" style={{ display: 'block', marginTop: 4 }}>
                            🔒 API Key tersimpan (terenkripsi): {aiConfig.api_key_masked}
                        </span>
                    )}
                </p>
                <div className="settings-section__content">
                    <div className="settings-field">
                        <label className="settings-field__label">Base URL (OpenAI Compatible)</label>
                        <input
                            className="settings-field__input"
                            type="url"
                            placeholder="https://api.openai.com/v1"
                            value={aiBaseUrl}
                            onChange={(e) => setAiBaseUrl(e.target.value)}
                        />
                        <span className="settings-field__hint">Contoh: https://api.openai.com/v1, https://api.groq.com/openai/v1</span>
                    </div>

                    <div className="settings-field">
                        <label className="settings-field__label">API Key</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="settings-field__input"
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="sk-..."
                                value={aiApiKey}
                                onChange={(e) => setAiApiKey(e.target.value)}
                                style={{ paddingRight: 40 }}
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                style={{
                                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4
                                }}
                            >
                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <span className="settings-field__hint">Kosongkan jika tidak ingin mengubah</span>
                    </div>

                    <div className="settings-field">
                        <label className="settings-field__label">Model</label>
                        <input
                            className="settings-field__input"
                            type="text"
                            placeholder="gpt-4o-mini"
                            value={aiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                        />
                    </div>

                    <div className="settings-field">
                        <label className="settings-field__label">Custom Prompt (Opsional)</label>
                        <textarea
                            className="settings-field__input"
                            rows={4}
                            placeholder="Instruksi tambahan untuk AI, misal: 'Jawab dengan format bullet point yang ringkas'"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            style={{ resize: 'vertical', fontFamily: 'var(--font-family)' }}
                        />
                        <span className="settings-field__hint">Prompt ini akan ditambahkan ke instruksi dasar (tidak menggantikan). Hanya untuk meningkatkan kualitas jawaban AI.</span>
                    </div>

                    {aiError && (
                        <div className="settings-alert settings-alert--error">
                            <AlertCircle size={16} /> {aiError}
                        </div>
                    )}

                    {aiSaved && (
                        <div className="settings-alert settings-alert--success">
                            <CheckCircle size={16} /> Konfigurasi AI berhasil disimpan!
                        </div>
                    )}

                    <button
                        className="settings-save-btn"
                        onClick={handleSaveAI}
                        disabled={aiSaving}
                    >
                        {aiSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        {aiSaving ? 'Menyimpan...' : 'Simpan Konfigurasi AI'}
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="app-info mt-lg">
                <p className="app-info__name">Kelola Keuangan</p>
                <p className="app-info__version">v1.0.0 — Aplikasi Pengelola Keuangan Pribadi</p>
            </div>
        </div>
    );
}
