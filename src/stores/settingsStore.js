import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            currency: import.meta.env.VITE_DEFAULT_CURRENCY || 'IDR',
            setCurrency: (currency) => set({ currency }),

            notificationEnabled: false,
            setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),
        }),
        { name: 'kelolaku-settings' }
    )
);

export default useSettingsStore;
