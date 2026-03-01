import { create } from 'zustand';
import api from '../utils/api';

const useAIStore = create((set, get) => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    isLoading: false,
    isSending: false,
    aiConfig: null,

    // Sessions
    fetchSessions: async () => {
        try {
            const { data } = await api.get('/ai/sessions');
            set({ sessions: data.data || [] });
        } catch {
            // silently fail
        }
    },

    createSession: async () => {
        try {
            const { data } = await api.post('/ai/sessions');
            const session = data.data;
            set((s) => ({
                sessions: [session, ...s.sessions],
                activeSessionId: session.id,
                messages: [],
            }));
            return session;
        } catch {
            return null;
        }
    },

    deleteSession: async (id) => {
        try {
            await api.delete(`/ai/sessions/${id}`);
            set((s) => {
                const sessions = s.sessions.filter((sess) => sess.id !== id);
                const isActive = s.activeSessionId === id;
                return {
                    sessions,
                    activeSessionId: isActive ? null : s.activeSessionId,
                    messages: isActive ? [] : s.messages,
                };
            });
        } catch {
            // silently fail
        }
    },

    setActiveSession: async (id) => {
        if (id === get().activeSessionId) return;
        set({ activeSessionId: id, messages: [], isLoading: true });
        try {
            const { data } = await api.get(`/ai/sessions/${id}/messages`);
            set({ messages: data.data || [], isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },

    // Chat
    sendMessage: async (message) => {
        const { activeSessionId } = get();
        set({ isSending: true });

        // Optimistic: add user message immediately
        const tempUserMsg = { id: Date.now(), role: 'user', content: message, created_at: new Date().toISOString() };
        set((s) => ({ messages: [...s.messages, tempUserMsg] }));

        try {
            const { data } = await api.post('/ai/chat', {
                session_id: activeSessionId || 0,
                message,
            });

            const result = data.data;
            const assistantMsg = result.message;

            set((s) => {
                // Replace temp user msg, add assistant msg
                const msgs = [...s.messages.filter((m) => m.id !== tempUserMsg.id)];
                // Add real user msg
                msgs.push({ id: assistantMsg.id - 1, role: 'user', content: message, created_at: assistantMsg.created_at });
                msgs.push(assistantMsg);

                // Update session in list
                const newSessionId = result.session_id;
                let sessions = s.sessions;
                if (!activeSessionId) {
                    // New session was created server-side
                    sessions = [{ id: newSessionId, title: message.slice(0, 50), updated_at: new Date().toISOString() }, ...sessions];
                } else {
                    sessions = sessions.map((sess) =>
                        sess.id === newSessionId ? { ...sess, updated_at: new Date().toISOString() } : sess
                    );
                }

                return {
                    messages: msgs,
                    activeSessionId: newSessionId,
                    sessions,
                    isSending: false,
                };
            });

            return assistantMsg;
        } catch (err) {
            // Remove temp message, show error
            set((s) => ({
                messages: s.messages.filter((m) => m.id !== tempUserMsg.id),
                isSending: false,
            }));
            const errorMsg = err.response?.data?.message || 'Gagal mengirim pesan. Silakan coba lagi.';
            throw new Error(errorMsg);
        }
    },

    // AI Config
    fetchAIConfig: async () => {
        try {
            const { data } = await api.get('/ai/config');
            set({ aiConfig: data.data });
        } catch {
            // silently fail
        }
    },

    updateAIConfig: async (config) => {
        const { data } = await api.put('/ai/config', config);
        set({ aiConfig: data.data });
        return data.data;
    },

    // AI Insight (Dashboard)
    insight: null,
    insightLoading: false,

    fetchInsight: async () => {
        set({ insightLoading: true });
        try {
            const { data } = await api.get('/ai/insight');
            set({ insight: data.data, insightLoading: false });
        } catch {
            set({ insightLoading: false });
        }
    },

    refreshInsight: async () => {
        set({ insightLoading: true });
        try {
            const { data } = await api.post('/ai/insight/refresh');
            set({ insight: data.data, insightLoading: false });
        } catch {
            set({ insightLoading: false });
        }
    },

    // Clear
    clearChat: () => set({ activeSessionId: null, messages: [] }),
}));

export default useAIStore;
