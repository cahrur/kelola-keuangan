import { useState, useEffect } from 'react';

/**
 * Format a number with dot separator for thousands (Rupiah style).
 * Example: 10000 → "10.000"
 */
function formatNumber(value) {
    if (!value && value !== 0) return '';
    const num = String(value).replace(/[^\d]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('id-ID');
}

/**
 * Parse formatted string back to number.
 * Example: "10.000" → 10000
 */
function parseNumber(formatted) {
    if (!formatted) return '';
    const cleaned = String(formatted).replace(/\./g, '').replace(/,/g, '');
    return cleaned;
}

/**
 * CurrencyInput — input field that auto-formats numbers with dot separator.
 * Props: value (raw number string), onChange (receives raw number string), ...rest
 */
export default function CurrencyInput({ value, onChange, ...rest }) {
    const [display, setDisplay] = useState('');

    useEffect(() => {
        setDisplay(formatNumber(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = parseNumber(e.target.value);
        setDisplay(formatNumber(raw));
        onChange(raw);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            {...rest}
        />
    );
}
