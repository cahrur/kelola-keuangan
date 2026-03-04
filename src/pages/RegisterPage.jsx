import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../stores/authStore';
import TurnstileWidget from '../components/ui/TurnstileWidget';
import {
    getAuthErrorMessage,
    normalizePhone,
    validateGooglePhone,
    validateRegisterForm,
} from '../utils/authValidation';
import logoImg from '../assets/logo.webp';
import './AuthPage.css';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const IS_TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, googleLogin } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [turnstileError, setTurnstileError] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const turnstileRef = useRef(null);
    const googleRef = useRef(null);
    const [googleWidth, setGoogleWidth] = useState(300);

    // Google OAuth: phone step
    const [googleStep, setGoogleStep] = useState(null);
    const [googlePhone, setGooglePhone] = useState('');

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

        const errors = validateRegisterForm({ name, email, phone, password });
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        if (!validateTurnstile()) return;

        setLoading(true);
        try {
            await register(name.trim(), email.trim(), normalizePhone(phone), password, turnstileToken);
            navigate('/');
        } catch (err) {
            setSubmitError(getAuthErrorMessage(err, 'Pendaftaran gagal. Coba lagi.'));
            resetTurnstile();
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = (credentialResponse) => {
        setSubmitError('');
        setTurnstileError('');
        setTurnstileToken('');
        setGoogleStep({ credential: credentialResponse.credential });
    };

    const handleGoogleComplete = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setTurnstileError('');

        const phoneError = validateGooglePhone(googlePhone);
        if (phoneError) {
            setFieldErrors({ googlePhone: phoneError });
            return;
        }

        setFieldErrors((prev) => {
            if (!prev.googlePhone) return prev;
            const next = { ...prev };
            delete next.googlePhone;
            return next;
        });

        if (!validateTurnstile()) return;

        setLoading(true);
        try {
            await googleLogin(googleStep.credential, normalizePhone(googlePhone), turnstileToken);
            navigate('/');
        } catch (err) {
            setSubmitError(getAuthErrorMessage(err, 'Daftar Google gagal. Coba lagi.'));
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

    // Google phone step
    if (googleStep) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-card__header">
                        <img className="auth-card__logo" src={logoImg} alt="Kelola Keuangan" width="64" height="64" />
                        <h1 className="auth-card__title">Daftar dengan Google</h1>
                        <p className="auth-card__subtitle">Masukkan nomor WhatsApp kamu</p>
                    </div>
                    <form className="auth-google-phone" onSubmit={handleGoogleComplete}>
                        <div className="auth-google-phone__info">
                            Nomor WA digunakan untuk notifikasi & pemulihan akun
                        </div>
                        {submitError && <div className="auth-form__error">{submitError}</div>}
                        <div className="auth-form__group">
                            <label className="auth-form__label">Nomor WhatsApp *</label>
                            <input
                                className={`auth-form__input ${fieldErrors.googlePhone ? 'auth-form__input--error' : ''}`}
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                value={googlePhone}
                                onChange={(e) => {
                                    setGooglePhone(e.target.value);
                                    clearFieldError('googlePhone');
                                }}
                                required
                            />
                            {fieldErrors.googlePhone && <div className="auth-form__field-error">{fieldErrors.googlePhone}</div>}
                        </div>
                        {IS_TURNSTILE_ENABLED && (
                            <>
                                <TurnstileWidget
                                    ref={turnstileRef}
                                    siteKey={TURNSTILE_SITE_KEY}
                                    action="google_register"
                                    onVerify={handleTurnstileVerify}
                                    onExpire={handleTurnstileExpire}
                                    onError={handleTurnstileError}
                                />
                                {turnstileError && <div className="auth-form__field-error auth-form__field-error--center">{turnstileError}</div>}
                            </>
                        )}
                        <button className="auth-form__submit" type="submit" disabled={loading}>
                            {loading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                        <button
                            type="button"
                            className="auth-form__submit"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                            onClick={() => {
                                setGoogleStep(null);
                                setFieldErrors({});
                                setSubmitError('');
                                setTurnstileError('');
                                setTurnstileToken('');
                            }}
                        >
                            Kembali
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__header">
                    <img className="auth-card__logo" src={logoImg} alt="Kelola Keuangan" width="64" height="64" />
                    <h1 className="auth-card__title">Daftar</h1>
                    <p className="auth-card__subtitle">Buat akun baru untuk mengelola keuangan</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {submitError && <div className="auth-form__error">{submitError}</div>}

                    <div className="auth-form__group">
                        <label className="auth-form__label">Nama Lengkap</label>
                        <input
                            className={`auth-form__input ${fieldErrors.name ? 'auth-form__input--error' : ''}`}
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                clearFieldError('name');
                            }}
                            required
                        />
                        {fieldErrors.name && <div className="auth-form__field-error">{fieldErrors.name}</div>}
                    </div>

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
                        <label className="auth-form__label">Nomor WhatsApp</label>
                        <input
                            className={`auth-form__input ${fieldErrors.phone ? 'auth-form__input--error' : ''}`}
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                clearFieldError('phone');
                            }}
                            required
                        />
                        {fieldErrors.phone && <div className="auth-form__field-error">{fieldErrors.phone}</div>}
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
                            minLength={8}
                        />
                        {fieldErrors.password && <div className="auth-form__field-error">{fieldErrors.password}</div>}
                    </div>

                    {IS_TURNSTILE_ENABLED && (
                        <>
                            <TurnstileWidget
                                ref={turnstileRef}
                                siteKey={TURNSTILE_SITE_KEY}
                                action="register"
                                onVerify={handleTurnstileVerify}
                                onExpire={handleTurnstileExpire}
                                onError={handleTurnstileError}
                            />
                            {turnstileError && <div className="auth-form__field-error auth-form__field-error--center">{turnstileError}</div>}
                        </>
                    )}

                    <div className="auth-form__hint auth-form__hint--left">
                        Password minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, serta angka.
                    </div>

                    <button className="auth-form__submit" type="submit" disabled={loading}>
                        {loading ? 'Memproses...' : 'Daftar'}
                    </button>
                </form>

                <div className="auth-divider">
                    <div className="auth-divider__line" />
                    <span className="auth-divider__text">atau</span>
                    <div className="auth-divider__line" />
                </div>

                <div className="auth-google" ref={googleRef}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setSubmitError('Daftar Google gagal')}
                        theme="outline"
                        size="large"
                        text="signup_with"
                        shape="rectangular"
                        width={googleWidth}
                        logo_alignment="center"
                    />
                </div>

                <div className="auth-footer">
                    Sudah punya akun? <Link to="/login">Masuk</Link>
                </div>
            </div>
        </div>
    );
}
