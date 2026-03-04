import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../stores/authStore';
import TurnstileWidget from '../components/ui/TurnstileWidget';
import { getAuthErrorMessage, validateLoginForm } from '../utils/authValidation';
import logoImg from '../assets/logo.webp';
import './AuthPage.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const IS_TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [turnstileError, setTurnstileError] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const googleRef = useRef(null);
    const turnstileRef = useRef(null);
    const [googleWidth, setGoogleWidth] = useState(300);

    useEffect(() => {
        if (!googleRef.current) return;
        const ro = new ResizeObserver(([entry]) => {
            setGoogleWidth(Math.round(entry.contentRect.width));
        });
        ro.observe(googleRef.current);
        return () => ro.disconnect();
    }, []);

    const clearFieldError = (fieldName) => {
        setFieldErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const next = { ...prev };
            delete next[fieldName];
            return next;
        });
    };

    const resetTurnstile = () => {
        if (!IS_TURNSTILE_ENABLED) return;
        setTurnstileToken('');
        turnstileRef.current?.reset();
    };

    const validateTurnstile = () => {
        if (!IS_TURNSTILE_ENABLED) return true;
        if (turnstileToken) return true;
        setTurnstileError('Selesaikan verifikasi keamanan terlebih dahulu.');
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setTurnstileError('');

        const errors = validateLoginForm({ email, password });
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        if (!validateTurnstile()) return;

        setLoading(true);
        try {
            await login(email.trim(), password, turnstileToken);
            navigate('/');
        } catch (err) {
            setSubmitError(getAuthErrorMessage(err, 'Login gagal. Coba lagi.'));
            resetTurnstile();
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setSubmitError('');
        setTurnstileError('');
        if (!validateTurnstile()) return;

        setLoading(true);
        try {
            // Login: langsung masuk tanpa tanya nomor WA (akun sudah ada)
            await googleLogin(credentialResponse.credential, '', turnstileToken);
            navigate('/');
        } catch (err) {
            setSubmitError(getAuthErrorMessage(err, 'Login Google gagal. Coba lagi.'));
            resetTurnstile();
        } finally {
            setLoading(false);
        }
    };

    const handleTurnstileVerify = (token) => {
        setTurnstileToken(token);
        setTurnstileError('');
    };

    const handleTurnstileExpire = () => {
        setTurnstileToken('');
        setTurnstileError('Verifikasi keamanan kadaluarsa. Silakan ulangi.');
    };

    const handleTurnstileError = () => {
        setTurnstileToken('');
        setTurnstileError('Gagal memuat verifikasi keamanan. Coba refresh halaman.');
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__header">
                    <img className="auth-card__logo" src={logoImg} alt="Kelola Keuangan" width="64" height="64" fetchPriority="high" />
                    <h1 className="auth-card__title">Masuk</h1>
                    <p className="auth-card__subtitle">Kelola keuanganmu dengan mudah</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {submitError && <div className="auth-form__error">{submitError}</div>}

                    <div className="auth-form__group">
                        <label className="auth-form__label">Email</label>
                        <input
                            className={`auth-form__input ${fieldErrors.email ? 'auth-form__input--error' : ''}`}
                            type="email"
                            placeholder="email@contoh.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                clearFieldError('email');
                            }}
                            required
                        />
                        {fieldErrors.email && <div className="auth-form__field-error">{fieldErrors.email}</div>}
                    </div>

                    <div className="auth-form__group">
                        <label className="auth-form__label">Password</label>
                        <input
                            className={`auth-form__input ${fieldErrors.password ? 'auth-form__input--error' : ''}`}
                            type="password"
                            placeholder="Minimal 8 karakter"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                clearFieldError('password');
                            }}
                            required
                        />
                        {fieldErrors.password && <div className="auth-form__field-error">{fieldErrors.password}</div>}
                    </div>

                    {IS_TURNSTILE_ENABLED && (
                        <>
                            <TurnstileWidget
                                ref={turnstileRef}
                                siteKey={TURNSTILE_SITE_KEY}
                                action="login"
                                onVerify={handleTurnstileVerify}
                                onExpire={handleTurnstileExpire}
                                onError={handleTurnstileError}
                            />
                            {turnstileError && <div className="auth-form__field-error auth-form__field-error--center">{turnstileError}</div>}
                        </>
                    )}

                    <button className="auth-form__submit" type="submit" disabled={loading}>
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <div className="auth-forgot">
                    <Link to="/forgot-password">Lupa Password?</Link>
                </div>

                <div className="auth-divider">
                    <div className="auth-divider__line" />
                    <span className="auth-divider__text">atau</span>
                    <div className="auth-divider__line" />
                </div>

                <div className="auth-google" ref={googleRef}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setSubmitError('Login Google gagal')}
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        width={googleWidth}
                        logo_alignment="center"
                    />
                </div>

                <div className="auth-footer">
                    Belum punya akun? <Link to="/register">Daftar</Link>
                </div>
            </div>
        </div>
    );
}
