import { create } from 'zustand';
import api from '../utils/api';

const useAIStore = create((set, get) => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    isLoading: false,
    isSending: false,
    aiConfig: null,

    // Sessions — just load the list, no auto-select
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

    // Chat — backend creates session when session_id is 0
    sendMessage: async (message) => {
        const sessionId = get().activeSessionId || 0;
        set({ isSending: true });

        // Optimistic: add user message immediately
        const tempUserMsg = { id: Date.now(), role: 'user', content: message, created_at: new Date().toISOString() };
        set((s) => ({ messages: [...s.messages, tempUserMsg] }));

        try {
            const { data } = await api.post('/ai/chat', {
                session_id: sessionId,
                message,
            });

            const result = data.data;
            const assistantMsg = result.message;
            const returnedSessionId = result.sessionId;
            const sessionTitle = result.sessionTitle || message.slice(0, 50);

            set((s) => {
                const msgs = [...s.messages.filter((m) => m.id !== tempUserMsg.id)];
                msgs.push({ id: assistantMsg.id - 1, role: 'user', content: message, created_at: assistantMsg.created_at });
                msgs.push(assistantMsg);

                // Update or add session in list
                const existsInList = s.sessions.some((sess) => sess.id === returnedSessionId);
                let sessions;
                if (existsInList) {
                    sessions = s.sessions.map((sess) =>
                        sess.id === returnedSessionId
                            ? { ...sess, title: sessionTitle, updated_at: new Date().toISOString() }
                            : sess
                    );
                } else {
                    sessions = [
                        { id: returnedSessionId, title: sessionTitle, updated_at: new Date().toISOString(), created_at: new Date().toISOString() },
                        ...s.sessions,
                    ];
                }

                return {
                    messages: msgs,
                    activeSessionId: returnedSessionId,
                    sessions,
                    isSending: false,
                };
            });

            return assistantMsg;
        } catch (err) {
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

    // Clear — back to welcome screen
    clearChat: () => set({ activeSessionId: null, messages: [] }),
}));

export default useAIStore;
