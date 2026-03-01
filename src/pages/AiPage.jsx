import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, Plus, Menu, X, Trash2, MessageSquare, User } from 'lucide-react';
import useAIStore from '../stores/aiStore';
import './AiPage.css';

const SUGGESTIONS = [
    'Analisis keuangan saya bulan ini',
    'Bagaimana cara mengurangi pengeluaran?',
    'Berapa total hutang saya?',
    'Tips menabung dari penghasilan saya',
];

export default function AiPage() {
    const {
        sessions, activeSessionId, messages, isLoading, isSending,
        fetchSessions, createSession, deleteSession, setActiveSession,
        sendMessage, clearChat,
    } = useAIStore();

    const [input, setInput] = useState('');
    const [showSessions, setShowSessions] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const pageRef = useRef(null);

    useEffect(() => {
        fetchSessions();
    }, []);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    const autoResize = useCallback(() => {
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
        }
    }, []);

    const handleSend = async (customMessage) => {
        const msg = (customMessage || input).trim();
        if (!msg || isSending) return;

        setInput('');
        setError('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        try {
            await sendMessage(msg);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = async () => {
        clearChat();
        setShowSessions(false);
        setError('');
    };

    const handleSelectSession = (id) => {
        setActiveSession(id);
        setShowSessions(false);
        setError('');
    };

    const handleDeleteSession = async (e, id) => {
        e.stopPropagation();
        await deleteSession(id);
    };

    const formatContent = (content) => {
        // Simple markdown-like rendering
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n- /g, '\n• ')
            .replace(/\n(\d+)\. /g, '\n$1. ')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .split('\n')
            .map((line, i) => {
                if (line.startsWith('• ') || line.match(/^\d+\. /)) {
                    return `<li key="${i}">${line.replace(/^[•\d.]+\s*/, '')}</li>`;
                }
                return line;
            })
            .join('\n')
            .replace(/((?:<li.*?<\/li>\n?)+)/g, '<ul>$1</ul>')
            .split('\n')
            .filter(Boolean)
            .map((line) => {
                if (line.startsWith('<ul>') || line.startsWith('<li>')) return line;
                return `<p>${line}</p>`;
            })
            .join('');
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="ai-page" ref={pageRef}>
            {/* Header */}
            <div className="ai-header">
                <div className="ai-header__left">
                    <button className="ai-header__btn" onClick={() => setShowSessions(true)}>
                        <Menu size={20} />
                    </button>
                    <span className="ai-header__title">Asisten AI</span>
                    <span className="ai-header__badge">Beta</span>
                </div>
                <div className="ai-header__actions">
                    <button className="ai-header__btn" onClick={handleNewChat} title="Chat Baru">
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Messages or Welcome */}
            {!hasMessages && !isLoading ? (
                <div className="ai-welcome">
                    <div className="ai-welcome__icon">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="ai-welcome__title">Halo! 👋</h2>
                    <p className="ai-welcome__text">
                        Saya AI Asisten, asisten keuangan pribadimu. Tanya apapun tentang keuanganmu — saya bisa baca data transaksi, kantong, hutang, tanggungan, dan anggaranmu.
                    </p>
                    <div className="ai-welcome__suggestions">
                        {SUGGESTIONS.map((s) => (
                            <button key={s} className="ai-welcome__suggestion" onClick={() => handleSend(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="ai-messages">
                    {isLoading ? (
                        <div className="ai-typing">
                            <div className="ai-bubble__avatar" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                <Sparkles size={14} />
                            </div>
                            <div className="ai-typing__dots">
                                <div className="ai-typing__dot" />
                                <div className="ai-typing__dot" />
                                <div className="ai-typing__dot" />
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`ai-bubble ai-bubble--${msg.role}`}>
                                <div className="ai-bubble__avatar">
                                    {msg.role === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                                </div>
                                <div>
                                    <div
                                        className="ai-bubble__content"
                                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                                    />
                                </div>
                            </div>
                        ))
                    )}

                    {isSending && (
                        <div className="ai-typing">
                            <div className="ai-bubble__avatar" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                <Sparkles size={14} />
                            </div>
                            <div className="ai-typing__dots">
                                <div className="ai-typing__dot" />
                                <div className="ai-typing__dot" />
                                <div className="ai-typing__dot" />
                            </div>
                        </div>
                    )}

                    {error && <div className="ai-error">{error}</div>}

                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input */}
            <div className="ai-input">
                <textarea
                    ref={textareaRef}
                    className="ai-input__field"
                    placeholder="Tanya tentang keuanganmu..."
                    value={input}
                    onChange={(e) => { setInput(e.target.value); autoResize(); }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isSending}
                />
                <button
                    className="ai-input__send"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isSending}
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Sessions Drawer */}
            {showSessions && (
                <>
                    <div className="ai-sessions-overlay" onClick={() => setShowSessions(false)} />
                    <div className="ai-sessions">
                        <div className="ai-sessions__header">
                            <span className="ai-sessions__title">Riwayat Chat</span>
                            <button className="ai-header__btn" onClick={() => setShowSessions(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '8px 12px' }}>
                            <button
                                className="ai-welcome__suggestion"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px' }}
                                onClick={handleNewChat}
                            >
                                <Plus size={14} /> Chat Baru
                            </button>
                        </div>
                        <div className="ai-sessions__list">
                            {sessions.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)', padding: 16 }}>
                                    Belum ada riwayat chat
                                </p>
                            ) : (
                                sessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className={`ai-sessions__item ${s.id === activeSessionId ? 'ai-sessions__item--active' : ''}`}
                                        onClick={() => handleSelectSession(s.id)}
                                    >
                                        <MessageSquare size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                                        <span className="ai-sessions__item-title">{s.title}</span>
                                        <button className="ai-sessions__item-delete" onClick={(e) => handleDeleteSession(e, s.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
