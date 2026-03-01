import { create } from 'zustand';
import api from '../utils/api';

const useDebtStore = create((set, get) => ({
    debts: [],
    loaded: false,

    fetchDebts: async () => {
        try {
            const { data } = await api.get('/debts');
            set({ debts: data.data || [], loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    addDebt: async (debt) => {
        const { data } = await api.post('/debts', {
            ...debt,
            paidAmount: 0,
        });
        set((state) => ({ debts: [data.data, ...state.debts] }));
        return data.data;
    },

    updateDebt: async (id, updates) => {
        const { data } = await api.put(`/debts/${id}`, updates);
        set((state) => ({
            debts: state.debts.map((d) => (d.id === id ? data.data : d)),
        }));
    },

    deleteDebt: async (id) => {
        await api.delete(`/debts/${id}`);
        set((state) => ({ debts: state.debts.filter((d) => d.id !== id) }));
    },

    markAsPaid: async (id) => {
        const debt = get().debts.find((d) => d.id === id);
        if (!debt) return;
        await api.put(`/debts/${id}`, { status: 'paid', paidAmount: debt.amount });
        set((state) => ({
            debts: state.debts.map((d) =>
                d.id === id ? { ...d, status: 'paid', paidAmount: d.amount } : d
            ),
        }));
    },

    getTotalOwed: () => {
        return get()
            .debts.filter((d) => d.type === 'i_owe' && d.status === 'active')
            .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    },

    getTotalLent: () => {
        return get()
            .debts.filter((d) => d.type === 'they_owe' && d.status === 'active')
            .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    },

    getRemaining: (id) => {
        const debt = get().debts.find((d) => d.id === id);
        if (!debt) return 0;
        return Math.max(debt.amount - (debt.paidAmount || 0), 0);
    },

    getPaid: (id) => {
        const debt = get().debts.find((d) => d.id === id);
        if (!debt) return 0;
        return debt.paidAmount || 0;
    },

    getProgress: (id) => {
        const debt = get().debts.find((d) => d.id === id);
        if (!debt || debt.amount === 0) return 0;
        return Math.round(((debt.paidAmount || 0) / debt.amount) * 100);
    },

    getActiveDebts: (type) => {
        return get().debts.filter((d) => d.type === type && d.status === 'active');
    },

    getSettledDebts: (type) => {
        return get().debts.filter((d) => d.type === type && d.status !== 'active');
    },
}));

export default useDebtStore;
