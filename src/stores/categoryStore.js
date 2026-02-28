import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import { generateId } from '../utils/formatters';

const useCategoryStore = create(
    persist(
        (set, get) => ({
            categories: DEFAULT_CATEGORIES,

            addCategory: (category) =>
                set((state) => ({
                    categories: [...state.categories, { ...category, id: generateId() }],
                })),

            updateCategory: (id, updates) =>
                set((state) => ({
                    categories: state.categories.map((cat) =>
                        cat.id === id ? { ...cat, ...updates } : cat
                    ),
                })),

            deleteCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((cat) => cat.id !== id),
                })),

            getCategoriesByType: (type) => {
                return get().categories.filter((cat) => cat.type === type);
            },

            getCategoryById: (id) => {
                return get().categories.find((cat) => cat.id === id);
            },
        }),
        { name: 'catatku-categories' }
    )
);

export default useCategoryStore;
