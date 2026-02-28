import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/formatters';

const useDebtStore = create(
    persist(
        (set, get) => ({
            debts: [],

            addDebt: (debt) =>
                set((state) => ({
                    debts: [
                        {
                            ...debt,
                            id: generateId(),
                            createdAt: new Date().toISOString(),
                            payments: [],
                            status: 'active',
                        },
                        ...state.debts,
                    ],
                })),

            updateDebt: (id, updates) =>
                set((state) => ({
                    debts: state.debts.map((d) =>
                        d.id === id ? { ...d, ...updates } : d
                    ),
                })),

            deleteDebt: (id) =>
                set((state) => ({
                    debts: state.debts.filter((d) => d.id !== id),
                })),

            addPayment: (debtId, amount, date) => {
                set((state) => ({
                    debts: state.debts.map((d) => {
                        if (d.id !== debtId) return d;
                        const newPayments = [...d.payments, { id: generateId(), amount, date, createdAt: new Date().toISOString() }];
                        const totalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
                        const newStatus = totalPaid >= d.amount ? 'paid' : 'active';
                        return { ...d, payments: newPayments, status: newStatus };
                    }),
                }));
            },

            markAsPaid: (id) =>
                set((state) => ({
                    debts: state.debts.map((d) =>
                        d.id === id ? { ...d, status: 'paid' } : d
                    ),
                })),

            getTotalOwed: () => {
                // Hutang saya ke orang lain (I owe)
                return get()
                    .debts.filter((d) => d.type === 'i_owe' && d.status === 'active')
                    .reduce((sum, d) => {
                        const paid = d.payments.reduce((s, p) => s + p.amount, 0);
                        return sum + (d.amount - paid);
                    }, 0);
            },

            getTotalLent: () => {
                // Orang lain berhutang ke saya (they owe)
                return get()
                    .debts.filter((d) => d.type === 'they_owe' && d.status === 'active')
                    .reduce((sum, d) => {
                        const paid = d.payments.reduce((s, p) => s + p.amount, 0);
                        return sum + (d.amount - paid);
                    }, 0);
            },

            getRemainingAmount: (id) => {
                const debt = get().debts.find((d) => d.id === id);
                if (!debt) return 0;
                const paid = debt.payments.reduce((s, p) => s + p.amount, 0);
                return Math.max(debt.amount - paid, 0);
            },

            getPaidAmount: (id) => {
                const debt = get().debts.find((d) => d.id === id);
                if (!debt) return 0;
                return debt.payments.reduce((s, p) => s + p.amount, 0);
            },
        }),
        { name: 'catatku-debts' }
    )
);

export default useDebtStore;
