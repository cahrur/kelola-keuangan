import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            currency: import.meta.env.VITE_DEFAULT_CURRENCY || 'IDR',

            // AI API Settings (client-side only)
            aiBaseUrl: '',
            aiApiKey: '',
            aiPrompt: 'Kamu adalah asisten keuangan pribadi. Berikan saran singkat berdasarkan data keuangan pengguna.',

            setCurrency: (currency) => set({ currency }),
            setAiBaseUrl: (aiBaseUrl) => set({ aiBaseUrl }),
            setAiApiKey: (aiApiKey) => set({ aiApiKey }),
            setAiPrompt: (aiPrompt) => set({ aiPrompt }),
        }),
        { name: 'catatku-settings' }
    )
);

export default useSettingsStore;
