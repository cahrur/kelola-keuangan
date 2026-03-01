/**
 * Convert snake_case keys to camelCase recursively.
 * Used to normalize backend API responses (snake_case) to frontend JS convention (camelCase).
 */
export function toCamel(str) {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function camelizeKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(camelizeKeys);
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [toCamel(key), camelizeKeys(value)])
        );
    }
    return obj;
}

/**
 * Convert camelCase keys to snake_case recursively.
 * Used to normalize frontend JS data to backend API convention (snake_case) for POST/PUT.
 */
export function toSnake(str) {
    return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

export function snakeizeKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(snakeizeKeys);
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [toSnake(key), snakeizeKeys(value)])
        );
    }
    return obj;
}
