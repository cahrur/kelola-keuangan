import { create } from 'zustand';
import api from '../utils/api';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const useObligationStore = create((set, get) => ({
    obligations: [],
    loaded: false,

    fetchObligations: async () => {
        try {
            const { data } = await api.get('/obligations');
            const obligations = data.data || [];
            const withChecklist = await Promise.all(
                obligations.map(async (o) => {
                    try {
                        const { data: checklistData } = await api.get(`/obligations/${o.id}/checklist`);
                        return { ...o, checklist: checklistData.data || [] };
                    } catch {
                        return { ...o, checklist: [] };
                    }
                })
            );
            set({ obligations: withChecklist, loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    addObligation: async (data_) => {
        // Request body auto-snakeized by interceptor
        const payload = {
            name: data_.name,
            description: data_.description || '',
            type: data_.type,
            startDate: data_.startDate,
            endDate: data_.endDate || '',
            amount: data_.amount,
            autoRecord: data_.autoRecord || false,
        };
        const { data } = await api.post('/obligations', payload);
        set((state) => ({
            obligations: [{ ...data.data, checklist: [] }, ...state.obligations],
        }));
        return data.data;
    },

    updateObligation: async (id, updates) => {
        // Request body auto-snakeized by interceptor — just pass camelCase
        const { data } = await api.put(`/obligations/${id}`, updates);
        set((state) => ({
            obligations: state.obligations.map((o) =>
                o.id === id ? { ...data.data, checklist: o.checklist } : o
            ),
        }));
    },

    deleteObligation: async (id) => {
        await api.delete(`/obligations/${id}`);
        set((state) => ({
            obligations: state.obligations.filter((o) => o.id !== id),
        }));
    },

    togglePeriod: async (obligationId, periodKey) => {
        await api.post(`/obligations/${obligationId}/checklist`, { period: periodKey });
        try {
            const { data } = await api.get(`/obligations/${obligationId}/checklist`);
            set((state) => ({
                obligations: state.obligations.map((o) =>
                    o.id === obligationId ? { ...o, checklist: data.data || [] } : o
                ),
            }));
        } catch {
            // fallback
        }
    },

    isPeriodPaid: (obligationId, periodKey) => {
        const o = get().obligations.find((ob) => ob.id === obligationId);
        if (!o) return false;
        return (o.checklist || []).some((c) => c.period === periodKey);
    },

    getPeriodsForObligation: (obligation) => {
        const periods = [];
        const start = new Date(obligation.startDate);
        const end = obligation.endDate ? new Date(obligation.endDate) : new Date();
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
}));

export default useObligationStore;
