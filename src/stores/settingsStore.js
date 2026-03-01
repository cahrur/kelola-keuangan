import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            currency: import.meta.env.VITE_DEFAULT_CURRENCY || 'IDR',
            setCurrency: (currency) => set({ currency }),
        }),
        { name: 'kelolaku-settings' }
    )
);

export default useSettingsStore;
