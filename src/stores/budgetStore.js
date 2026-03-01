import { create } from 'zustand';
import api from '../utils/api';

const useBudgetStore = create((set, get) => ({
    budgets: [],
    loaded: false,

    fetchBudgets: async () => {
        try {
            const { data } = await api.get('/budgets');
            set({ budgets: data.data || [], loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    fetchBudgetsByMonth: async (month, year) => {
        try {
            const { data } = await api.get(`/budgets?month=${month}&year=${year}`);
            const fetched = data.data || [];
            // Merge: replace budgets for this month+year, keep others
            set((state) => {
                const otherBudgets = state.budgets.filter(
                    (b) => !(b.month === month && b.year === year)
                );
                return { budgets: [...otherBudgets, ...fetched] };
            });
        } catch {
            // keep existing
        }
    },

    setBudget: async (budget) => {
        // Request body auto-snakeized by interceptor — just use camelCase
        const { data } = await api.post('/budgets', {
            categoryId: parseInt(budget.categoryId),
            amount: parseFloat(budget.amount),
            month: budget.month,
            year: budget.year,
            period: budget.period || 'once',
        });
        const updated = data.data;
        set((state) => {
            const existing = state.budgets.find(
                (b) =>
                    b.categoryId === updated.categoryId &&
                    b.month === updated.month &&
                    b.year === updated.year
            );
            if (existing) {
                return {
                    budgets: state.budgets.map((b) =>
                        b.id === existing.id ? updated : b
                    ),
                };
            }
            return { budgets: [...state.budgets, updated] };
        });
    },

    removeBudget: async (id) => {
        await api.delete(`/budgets/${id}`);
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
    },

    getBudgetsForMonth: (month, year) => {
        return get().budgets.filter(
            (b) => b.month === month && b.year === year
        );
    },

    getBudgetForCategory: (categoryId, month, year) => {
        return get().budgets.find(
            (b) =>
                b.categoryId === categoryId &&
                b.month === month &&
                b.year === year
        );
    },
}));

export default useBudgetStore;
