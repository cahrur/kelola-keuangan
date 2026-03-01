import { create } from 'zustand';
import api from '../utils/api';

const useCategoryStore = create((set, get) => ({
    categories: [],
    loaded: false,

    fetchCategories: async () => {
        try {
            const { data } = await api.get('/categories');
            set({ categories: data.data || [], loaded: true });
        } catch {
            set({ loaded: true });
        }
    },

    addCategory: async (category) => {
        const { data } = await api.post('/categories', category);
        set((state) => ({ categories: [...state.categories, data.data] }));
        return data.data;
    },

    updateCategory: async (id, updates) => {
        const { data } = await api.put(`/categories/${id}`, updates);
        set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? data.data : c)),
        }));
    },

    deleteCategory: async (id) => {
        await api.delete(`/categories/${id}`);
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    },

    getCategoriesByType: (type) => {
        return get().categories.filter((cat) => cat.type === type);
    },

    getCategoryById: (id) => {
        return get().categories.find((cat) => cat.id === id);
    },
}));

export default useCategoryStore;
