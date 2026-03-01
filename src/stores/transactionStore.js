import { create } from 'zustand';
import api from '../utils/api';
import useWalletStore from './walletStore';

const useTransactionStore = create((set, get) => ({
    transactions: [],
    loaded: false,

    fetchTransactions: async () => {
        try {
            const { data } = await api.get('/transactions');
            set({ transactions: data.data || [], loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    addTransaction: async (transaction) => {
        const { data } = await api.post('/transactions', transaction);
        set((state) => ({ transactions: [data.data, ...state.transactions] }));
        // Re-fetch wallets to reflect balance changes
        useWalletStore.getState().fetchWallets();
        return data.data;
    },

    updateTransaction: async (id, updates) => {
        const { data } = await api.put(`/transactions/${id}`, updates);
        set((state) => ({
            transactions: state.transactions.map((t) => (t.id === id ? data.data : t)),
        }));
        useWalletStore.getState().fetchWallets();
    },

    deleteTransaction: async (id) => {
        await api.delete(`/transactions/${id}`);
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
        useWalletStore.getState().fetchWallets();
    },

    getFilteredTransactions: ({ type, categoryId, startDate, endDate, search }) => {
        let filtered = get().transactions;
        if (type) filtered = filtered.filter((t) => t.type === type);
        if (categoryId) filtered = filtered.filter((t) => t.categoryId === categoryId);
        if (startDate) filtered = filtered.filter((t) => t.date >= startDate);
        if (endDate) filtered = filtered.filter((t) => t.date <= endDate);
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.description.toLowerCase().includes(q) ||
                    t.amount.toString().includes(q)
            );
        }
        return filtered.sort((a, b) => b.date.localeCompare(a.date));
    },

    getTotalByType: (type, month, year) => {
        return get()
            .transactions.filter((t) => {
                const d = new Date(t.date);
                const matchType = t.type === type;
                const matchMonth = month !== undefined ? d.getMonth() === month : true;
                const matchYear = year !== undefined ? d.getFullYear() === year : true;
                return matchType && matchMonth && matchYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    },

    getMonthlyData: (year) => {
        const data = [];
        for (let month = 0; month < 12; month++) {
            const monthTxns = get().transactions.filter((t) => {
                const d = new Date(t.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
            const income = monthTxns
                .filter((t) => t.type === 'income')
                .reduce((s, t) => s + t.amount, 0);
            const expense = monthTxns
                .filter((t) => t.type === 'expense')
                .reduce((s, t) => s + t.amount, 0);
            data.push({ month, income, expense, balance: income - expense });
        }
        return data;
    },

    getCategoryBreakdown: (type, month, year) => {
        const txns = get().transactions.filter((t) => {
            const d = new Date(t.date);
            const matchType = t.type === type;
            const matchMonth = month !== undefined ? d.getMonth() === month : true;
            const matchYear = year !== undefined ? d.getFullYear() === year : true;
            return matchType && matchMonth && matchYear;
        });
        const breakdown = {};
        txns.forEach((t) => {
            const key = t.categoryId;
            if (!breakdown[key]) breakdown[key] = 0;
            breakdown[key] += t.amount;
        });
        return Object.entries(breakdown)
            .map(([categoryId, amount]) => ({ categoryId: Number(categoryId), amount }))
            .sort((a, b) => b.amount - a.amount);
    },
}));

export default useTransactionStore;
