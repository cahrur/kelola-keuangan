import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../stores/authStore';
import logoImg from '../assets/logo.webp';
import './AuthPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const googleRef = useRef(null);
    const [googleWidth, setGoogleWidth] = useState(300);

    useEffect(() => {
        if (!googleRef.current) return;
        const ro = new ResizeObserver(([entry]) => {
            setGoogleWidth(Math.round(entry.contentRect.width));
        });
        ro.observe(googleRef.current);
        return () => ro.disconnect();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            // Login: langsung masuk tanpa tanya nomor WA (akun sudah ada)
            await googleLogin(credentialResponse.credential, '');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login Google gagal');
        } finally {
            setLoading(false);
        }
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
                    {error && <div className="auth-form__error">{error}</div>}

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
                        <label className="auth-form__label">Password</label>
                        <input
                            className="auth-form__input"
                            type="password"
                            placeholder="Minimal 8 karakter"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

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
                        onError={() => setError('Login Google gagal')}
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
