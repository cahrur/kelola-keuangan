import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../stores/authStore';
import './AuthPage.css';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, googleLogin } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Google OAuth: phone step
    const [googleStep, setGoogleStep] = useState(null);
    const [googlePhone, setGooglePhone] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password minimal 8 karakter');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, phone, password);
            // After register, auto-login
            const { login } = useAuthStore.getState();
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Pendaftaran gagal');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = (credentialResponse) => {
        setGoogleStep({ credential: credentialResponse.credential });
    };

    const handleGoogleComplete = async (e) => {
        e.preventDefault();
        setError('');

        if (!googlePhone) {
            setError('Nomor WhatsApp wajib diisi');
            return;
        }

        setLoading(true);
        try {
            await googleLogin(googleStep.credential, googlePhone);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Daftar Google gagal');
        } finally {
            setLoading(false);
        }
    };

    // Google phone step
    if (googleStep) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-card__header">
                        <div className="auth-card__logo">💰</div>
                        <h1 className="auth-card__title">Daftar dengan Google</h1>
                        <p className="auth-card__subtitle">Masukkan nomor WhatsApp kamu</p>
                    </div>
                    <form className="auth-google-phone" onSubmit={handleGoogleComplete}>
                        <div className="auth-google-phone__info">
                            Nomor WA digunakan untuk notifikasi & pemulihan akun
                        </div>
                        {error && <div className="auth-form__error">{error}</div>}
                        <div className="auth-form__group">
                            <label className="auth-form__label">Nomor WhatsApp *</label>
                            <input
                                className="auth-form__input"
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                value={googlePhone}
                                onChange={(e) => setGooglePhone(e.target.value)}
                                required
                            />
                        </div>
                        <button className="auth-form__submit" type="submit" disabled={loading}>
                            {loading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                        <button
                            type="button"
                            className="auth-form__submit"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                            onClick={() => setGoogleStep(null)}
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
                    <div className="auth-card__logo">💰</div>
                    <h1 className="auth-card__title">Daftar</h1>
                    <p className="auth-card__subtitle">Buat akun baru untuk mengelola keuangan</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-form__error">{error}</div>}

                    <div className="auth-form__group">
                        <label className="auth-form__label">Nama Lengkap</label>
                        <input
                            className="auth-form__input"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-form__group">
                        <label className="auth-form__label">Email</label>
                        <input
                            className="auth-form__input"
                            type="email"
                            placeholder="email@contoh.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-form__group">
                        <label className="auth-form__label">Nomor WhatsApp</label>
                        <input
                            className="auth-form__input"
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-form__group">
                        <label className="auth-form__label">Password</label>
                        <input
                            className="auth-form__input"
                            type="password"
                            placeholder="Minimal 8 karakter"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
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

                <div className="auth-google">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Daftar Google gagal')}
                        theme="outline"
                        size="large"
                        text="signup_with"
                        shape="rectangular"
                        width="340"
                    />
                </div>

                <div className="auth-footer">
                    Sudah punya akun? <Link to="/login">Masuk</Link>
                </div>
            </div>
        </div>
    );
}
