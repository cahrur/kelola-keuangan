import { create } from 'zustand';
import axios from 'axios';
import api, { setAccessToken, clearAccessToken, getAccessToken } from '../utils/api';
import { camelizeKeys } from '../utils/normalize';

const API_URL = import.meta.env.VITE_API_URL || '';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: (user, token) => {
        setAccessToken(token);
        set({ user, isAuthenticated: true, isLoading: false });
    },

    register: async (name, email, phone, password) => {
        const { data } = await api.post('/auth/register', { name, email, phone, password });
        return data;
    },

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        get().setAuth(data.data.user, data.data.accessToken);
        return data;
    },

    googleLogin: async (credential, phone) => {
        const { data } = await api.post('/auth/google', { credential, phone });
        get().setAuth(data.data.user, data.data.accessToken);
        return data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // logout even if API fails
        }
        clearAccessToken();
        set({ user: null, isAuthenticated: false, isLoading: false });
    },

    checkAuth: async () => {
        // If we have access token in memory, verify it
        if (getAccessToken()) {
            try {
                const { data } = await api.get('/auth/me');
                set({ user: data.data, isAuthenticated: true, isLoading: false });
                return;
            } catch {
                clearAccessToken();
            }
        }

        // Try to get new access token via refresh cookie
        // Use raw axios (NOT the api instance) to avoid interceptor loop
        try {
            const res = await axios.post(
                `${API_URL}/api/v1/auth/refresh`,
                {},
                { withCredentials: true }
            );
            // Raw axios — need to camelize manually
            const camelData = camelizeKeys(res.data);
            const token = camelData.data.accessToken;
            setAccessToken(token);
            // Fetch user profile with new token
            const { data: meData } = await api.get('/auth/me');
            set({ user: meData.data, isAuthenticated: true, isLoading: false });
        } catch {
            // No valid session — user needs to login
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    forgotPassword: async (email) => {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data;
    },

    verifyOTP: async (email, otp) => {
        const { data } = await api.post('/auth/verify-otp', { email, otp });
        return data;
    },

    resetPassword: async (email, otp, password) => {
        const { data } = await api.post('/auth/reset-password', { email, otp, password });
        return data;
    },
}));

export default useAuthStore;
