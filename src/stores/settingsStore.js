import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'kk-';
    for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
};

const useSettingsStore = create(
    persist(
        (set, get) => ({
            currency: import.meta.env.VITE_DEFAULT_CURRENCY || 'IDR',

            // API Settings (auto-generated)
            apiBaseUrl: `${window.location.origin}/api`,
            apiKey: generateApiKey(),
            apiEnabled: false,

            setCurrency: (currency) => set({ currency }),
            setApiEnabled: (apiEnabled) => set({ apiEnabled }),
            regenerateApiKey: () => set({ apiKey: generateApiKey() }),

            // AI API Settings
            aiBaseUrl: '',
            aiApiKey: '',
            aiPrompt: 'Kamu adalah asisten keuangan pribadi. Berikan saran singkat berdasarkan data keuangan pengguna.',
            setAiBaseUrl: (aiBaseUrl) => set({ aiBaseUrl }),
            setAiApiKey: (aiApiKey) => set({ aiApiKey }),
            setAiPrompt: (aiPrompt) => set({ aiPrompt }),

            exportData: () => {
                const data = {};
                const keys = ['catatku-transactions', 'catatku-categories', 'catatku-budgets', 'catatku-settings', 'catatku-wallets', 'catatku-debts', 'catatku-obligations'];
                keys.forEach((key) => {
                    const raw = localStorage.getItem(key);
                    if (raw) data[key] = JSON.parse(raw);
                });
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `catatku-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            },

            importData: (jsonString) => {
                try {
                    const data = JSON.parse(jsonString);
                    Object.entries(data).forEach(([key, value]) => {
                        localStorage.setItem(key, JSON.stringify(value));
                    });
                    window.location.reload();
                } catch {
                    throw new Error('Format file tidak valid');
                }
            },

            resetAllData: () => {
                const keys = ['catatku-transactions', 'catatku-categories', 'catatku-budgets', 'catatku-settings', 'catatku-wallets', 'catatku-debts', 'catatku-obligations'];
                keys.forEach((key) => localStorage.removeItem(key));
                window.location.reload();
            },
        }),
        { name: 'catatku-settings' }
    )
);

export default useSettingsStore;
