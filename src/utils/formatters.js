import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { CURRENCIES } from './constants';

export function formatCurrency(amount, currencyCode = 'IDR') {
    const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateStr, formatStr = 'dd MM yyyy') {
    if (!dateStr) return '-';
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '-';
    return format(date, formatStr, { locale: id });
}

export function formatShortDate(dateStr) {
    return formatDate(dateStr, 'd MMM');
}

export function formatMonthYear(dateStr) {
    return formatDate(dateStr, 'MMMM yyyy');
}

export function abbreviateNumber(num) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'M';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'Jt';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'Rb';
    return num.toString();
}

export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
