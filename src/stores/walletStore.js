import { create } from 'zustand';
import api from '../utils/api';

const useWalletStore = create((set, get) => ({
    wallets: [],
    loaded: false,

    fetchWallets: async () => {
        try {
            const { data } = await api.get('/wallets');
            set({ wallets: data.data || [], loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    addWallet: async (wallet) => {
        const { data } = await api.post('/wallets', { ...wallet, balance: wallet.balance || 0 });
        set((state) => ({ wallets: [...state.wallets, data.data] }));
        return data.data;
    },

    updateWallet: async (id, updates) => {
        const { data } = await api.put(`/wallets/${id}`, updates);
        set((state) => ({
            wallets: state.wallets.map((w) => (w.id === id ? data.data : w)),
        }));
    },

    deleteWallet: async (id) => {
        await api.delete(`/wallets/${id}`);
        set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) }));
    },

    adjustBalance: async (id, amount) => {
        const wallet = get().wallets.find((w) => w.id === id);
        if (!wallet) return;
        const newBalance = wallet.balance + amount;
        await api.put(`/wallets/${id}`, { balance: newBalance });
        set((state) => ({
            wallets: state.wallets.map((w) =>
                w.id === id ? { ...w, balance: newBalance } : w
            ),
        }));
    },

    transfer: async (fromId, toId, amount, description) => {
        const { data } = await api.post('/wallets/transfer', {
            fromWalletId: fromId,
            toWalletId: toId,
            amount,
            description,
        });

        // Update both wallets from server response
        const fromWallet = data.data.fromWallet;
        const toWallet = data.data.toWallet;

        set((state) => ({
            wallets: state.wallets.map((w) => {
                if (w.id === fromWallet.id) return fromWallet;
                if (w.id === toWallet.id) return toWallet;
                return w;
            }),
        }));
    },

    fetchMutations: async (walletId) => {
        const { data } = await api.get(`/wallets/${walletId}/mutations`);
        return data.data || [];
    },

    getTotalBalance: () => {
        return get().wallets.reduce((sum, w) => sum + w.balance, 0);
    },

    getWalletById: (id) => {
        return get().wallets.find((w) => w.id === id);
    },
}));

export default useWalletStore;
