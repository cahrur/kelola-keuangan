import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/formatters';

const useTransactionStore = create(
    persist(
        (set, get) => ({
            transactions: [],

            addTransaction: (transaction) =>
                set((state) => ({
                    transactions: [
                        { ...transaction, id: generateId(), createdAt: new Date().toISOString() },
                        ...state.transactions,
                    ],
                })),

            updateTransaction: (id, updates) =>
                set((state) => ({
                    transactions: state.transactions.map((txn) =>
                        txn.id === id ? { ...txn, ...updates } : txn
                    ),
                })),

            deleteTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((txn) => txn.id !== id),
                })),

            getFilteredTransactions: ({ type, categoryId, startDate, endDate, search }) => {
                let filtered = get().transactions;

                if (type) {
                    filtered = filtered.filter((t) => t.type === type);
                }
                if (categoryId) {
                    filtered = filtered.filter((t) => t.categoryId === categoryId);
                }
                if (startDate) {
                    filtered = filtered.filter((t) => t.date >= startDate);
                }
                if (endDate) {
                    filtered = filtered.filter((t) => t.date <= endDate);
                }
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
                    const monthTransactions = get().transactions.filter((t) => {
                        const d = new Date(t.date);
                        return d.getFullYear() === year && d.getMonth() === month;
                    });
                    const income = monthTransactions
                        .filter((t) => t.type === 'income')
                        .reduce((s, t) => s + t.amount, 0);
                    const expense = monthTransactions
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
                    if (!breakdown[t.categoryId]) {
                        breakdown[t.categoryId] = 0;
                    }
                    breakdown[t.categoryId] += t.amount;
                });

                return Object.entries(breakdown)
                    .map(([categoryId, amount]) => ({ categoryId, amount }))
                    .sort((a, b) => b.amount - a.amount);
            },
        }),
        { name: 'catatku-transactions' }
    )
);

export default useTransactionStore;
