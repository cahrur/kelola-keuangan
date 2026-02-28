import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/formatters';

/**
 * Tanggungan = recurring obligation (bills, subscriptions, etc.)
 * Each tanggungan has a checklist of periods that can be marked as paid.
 * "Catat otomatis" means auto-record to transactions when checked.
 */
const useObligationStore = create(
    persist(
        (set, get) => ({
            obligations: [],

            addObligation: (data) =>
                set((state) => ({
                    obligations: [
                        {
                            id: generateId(),
                            name: data.name,
                            description: data.description || '',
                            type: data.type, // 'monthly' | 'yearly'
                            startDate: data.startDate,
                            endDate: data.endDate,
                            amount: data.amount,
                            autoRecord: data.autoRecord || false,
                            checklist: [], // [{ period: '2026-03', paidAt: '...', transactionId?: '...' }]
                            createdAt: new Date().toISOString(),
                        },
                        ...state.obligations,
                    ],
                })),

            updateObligation: (id, updates) =>
                set((state) => ({
                    obligations: state.obligations.map((o) =>
                        o.id === id ? { ...o, ...updates } : o
                    ),
                })),

            deleteObligation: (id) =>
                set((state) => ({
                    obligations: state.obligations.filter((o) => o.id !== id),
                })),

            togglePeriod: (obligationId, periodKey) => {
                set((state) => ({
                    obligations: state.obligations.map((o) => {
                        if (o.id !== obligationId) return o;
                        const existing = o.checklist.find((c) => c.period === periodKey);
                        if (existing) {
                            return { ...o, checklist: o.checklist.filter((c) => c.period !== periodKey) };
                        }
                        return {
                            ...o,
                            checklist: [...o.checklist, { period: periodKey, paidAt: new Date().toISOString() }],
                        };
                    }),
                }));
            },

            isPeriodPaid: (obligationId, periodKey) => {
                const o = get().obligations.find((ob) => ob.id === obligationId);
                if (!o) return false;
                return o.checklist.some((c) => c.period === periodKey);
            },

            getPeriodsForObligation: (obligation) => {
                const periods = [];
                const start = new Date(obligation.startDate);
                const end = obligation.endDate ? new Date(obligation.endDate) : new Date();
                // Extend end to at least current date
                const effectiveEnd = end > new Date() ? end : new Date();

                if (obligation.type === 'monthly') {
                    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
                    while (cursor <= effectiveEnd) {
                        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
                        const label = `${MONTH_SHORT[cursor.getMonth()]} ${cursor.getFullYear()}`;
                        periods.push({ key, label });
                        cursor.setMonth(cursor.getMonth() + 1);
                    }
                } else {
                    // yearly
                    for (let y = start.getFullYear(); y <= effectiveEnd.getFullYear(); y++) {
                        periods.push({ key: String(y), label: String(y) });
                    }
                }
                return periods;
            },

            getActiveCount: () => {
                const now = new Date();
                return get().obligations.filter((o) => {
                    if (o.endDate && new Date(o.endDate) < now) return false;
                    return true;
                }).length;
            },

            getTotalMonthlyAmount: () => {
                const now = new Date();
                return get()
                    .obligations.filter((o) => {
                        if (o.endDate && new Date(o.endDate) < now) return false;
                        return true;
                    })
                    .reduce((sum, o) => {
                        if (o.type === 'monthly') return sum + o.amount;
                        return sum + o.amount / 12;
                    }, 0);
            },
        }),
        { name: 'catatku-obligations' }
    )
);

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default useObligationStore;
