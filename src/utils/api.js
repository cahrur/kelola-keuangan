import axios from 'axios';
import { camelizeKeys, snakeizeKeys } from './normalize';

const API_URL = import.meta.env.VITE_API_URL || '';

// In-memory token storage per auth-standards Rule 4
// NEVER use localStorage or sessionStorage for access tokens
let accessToken = null;

export function getAccessToken() {
    return accessToken;
}

export function setAccessToken(token) {
    accessToken = token;
}

export function clearAccessToken() {
    accessToken = null;
}

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // for httpOnly refresh cookie
});

// Auto-convert request body from camelCase to snake_case
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Convert request body keys to snake_case for backend
    if (config.data && typeof config.data === 'object') {
        config.data = snakeizeKeys(config.data);
    }
    return config;
});

// Auto-convert response data from snake_case to camelCase
api.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object') {
            response.data = camelizeKeys(response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Camelize error response too
        if (error.response?.data && typeof error.response.data === 'object') {
            error.response.data = camelizeKeys(error.response.data);
        }

        // Never retry auth endpoints — prevents infinite refresh loop
        const isAuthUrl = originalRequest.url?.includes('/auth/');

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthUrl
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(
                    `${API_URL}/api/v1/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                // Raw axios response — still snake_case
                const newToken = data.data.access_token;
                setAccessToken(newToken);
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAccessToken();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

export default api;
