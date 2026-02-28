import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/formatters';

const useBudgetStore = create(
    persist(
        (set, get) => ({
            budgets: [],

            setBudget: (budget) => {
                const existing = get().budgets.find(
                    (b) =>
                        b.categoryId === budget.categoryId &&
                        b.month === budget.month &&
                        b.year === budget.year
                );

                if (existing) {
                    set((state) => ({
                        budgets: state.budgets.map((b) =>
                            b.id === existing.id ? { ...b, amount: budget.amount } : b
                        ),
                    }));
                } else {
                    set((state) => ({
                        budgets: [...state.budgets, { ...budget, id: generateId() }],
                    }));
                }
            },

            removeBudget: (id) =>
                set((state) => ({
                    budgets: state.budgets.filter((b) => b.id !== id),
                })),

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
        }),
        { name: 'catatku-budgets' }
    )
);

export default useBudgetStore;
