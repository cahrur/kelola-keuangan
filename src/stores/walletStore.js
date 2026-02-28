import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/formatters';

const DEFAULT_WALLETS = [
    { id: 'wallet-1', name: 'Dompet', icon: 'Wallet', color: '#3b987b', balance: 0 },
    { id: 'wallet-2', name: 'Bank', icon: 'Building', color: '#0984e3', balance: 0 },
    { id: 'wallet-3', name: 'E-Wallet', icon: 'Smartphone', color: '#22c55e', balance: 0 },
];

const useWalletStore = create(
    persist(
        (set, get) => ({
            wallets: DEFAULT_WALLETS,

            addWallet: (wallet) =>
                set((state) => ({
                    wallets: [...state.wallets, { ...wallet, id: generateId(), balance: wallet.balance || 0 }],
                })),

            updateWallet: (id, updates) =>
                set((state) => ({
                    wallets: state.wallets.map((w) =>
                        w.id === id ? { ...w, ...updates } : w
                    ),
                })),

            deleteWallet: (id) =>
                set((state) => ({
                    wallets: state.wallets.filter((w) => w.id !== id),
                })),

            adjustBalance: (id, amount) =>
                set((state) => ({
                    wallets: state.wallets.map((w) =>
                        w.id === id ? { ...w, balance: w.balance + amount } : w
                    ),
                })),

            transfer: (fromId, toId, amount) => {
                set((state) => ({
                    wallets: state.wallets.map((w) => {
                        if (w.id === fromId) return { ...w, balance: w.balance - amount };
                        if (w.id === toId) return { ...w, balance: w.balance + amount };
                        return w;
                    }),
                }));
            },

            getTotalBalance: () => {
                return get().wallets.reduce((sum, w) => sum + w.balance, 0);
            },

            getWalletById: (id) => {
                return get().wallets.find((w) => w.id === id);
            },
        }),
        { name: 'catatku-wallets' }
    )
);

export default useWalletStore;
