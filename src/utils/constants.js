export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
};

export const DEFAULT_CATEGORIES = [
    // Income
    { id: 'cat-1', name: 'Gaji', type: 'income', icon: 'Briefcase', color: '#22c55e' },
    { id: 'cat-2', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#00cec9' },
    { id: 'cat-3', name: 'Investasi', type: 'income', icon: 'TrendingUp', color: '#0984e3' },
    { id: 'cat-4', name: 'Lainnya', type: 'income', icon: 'Plus', color: '#3b987b' },
    // Expense
    { id: 'cat-5', name: 'Makanan', type: 'expense', icon: 'UtensilsCrossed', color: '#98503b' },
    { id: 'cat-6', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#fdcb6e' },
    { id: 'cat-7', name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#e84393' },
    { id: 'cat-8', name: 'Tagihan', type: 'expense', icon: 'Receipt', color: '#d63031' },
    { id: 'cat-9', name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#a29bfe' },
    { id: 'cat-10', name: 'Kesehatan', type: 'expense', icon: 'Heart', color: '#ff7675' },
    { id: 'cat-11', name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#74b9ff' },
    { id: 'cat-12', name: 'Lainnya', type: 'expense', icon: 'MoreHorizontal', color: '#636e72' },
];

export const CURRENCIES = [
    { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia', locale: 'id-ID' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'MYR', symbol: 'RM', name: 'Ringgit Malaysia', locale: 'ms-MY' },
    { code: 'SGD', symbol: 'S$', name: 'Dollar Singapura', locale: 'en-SG' },
];

export const CHART_COLORS = [
    '#3b987b', '#22c55e', '#98503b', '#2d7660', '#98873b',
    '#5fb89a', '#ef4444', '#0ea5e9', '#8b5cf6', '#f97316',
    '#e84393', '#00cec9', '#d63031', '#a29bfe', '#ff7675',
    '#74b9ff', '#55efc4', '#fab1a0', '#81ecec', '#dfe6e9',
];

export const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
