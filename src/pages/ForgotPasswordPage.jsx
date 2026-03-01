import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import './AuthPage.css';

const STEPS = { EMAIL: 0, OTP: 1, PASSWORD: 2, DONE: 3 };

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { forgotPassword, verifyOTP, resetPassword } = useAuthStore();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setStep(STEPS.OTP);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOTP(email, otp);
            setStep(STEPS.PASSWORD);
        } catch (err) {
            setError(err.response?.data?.message || 'Kode OTP tidak valid');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Password tidak sama');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email, otp, password);
            setStep(STEPS.DONE);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mereset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__header">
                    <h1 className="auth-card__title">
                        {step === STEPS.DONE ? 'Berhasil!' : 'Lupa Password'}
                    </h1>
                    <p className="auth-card__subtitle">
                        {step === STEPS.EMAIL && 'Masukkan email untuk menerima kode OTP'}
                        {step === STEPS.OTP && 'Masukkan kode OTP yang dikirim ke email'}
                        {step === STEPS.PASSWORD && 'Buat password baru'}
                        {step === STEPS.DONE && 'Password berhasil direset'}
                    </p>
                </div>

                {/* Step indicator */}
                {step !== STEPS.DONE && (
                    <div className="auth-steps">
                        <div className={`auth-steps__dot ${step >= STEPS.EMAIL ? 'auth-steps__dot--active' : ''}`} />
                        <div className={`auth-steps__line ${step >= STEPS.OTP ? 'auth-steps__line--active' : ''}`} />
                        <div className={`auth-steps__dot ${step >= STEPS.OTP ? 'auth-steps__dot--active' : ''}`} />
                        <div className={`auth-steps__line ${step >= STEPS.PASSWORD ? 'auth-steps__line--active' : ''}`} />
                        <div className={`auth-steps__dot ${step >= STEPS.PASSWORD ? 'auth-steps__dot--active' : ''}`} />
                    </div>
                )}

                {error && <div className="auth-form__error">{error}</div>}

                {/* Step 1: Email */}
                {step === STEPS.EMAIL && (
                    <form className="auth-form" onSubmit={handleSendOTP}>
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
                        <button className="auth-form__submit" type="submit" disabled={loading}>
                            {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === STEPS.OTP && (
                    <form className="auth-form" onSubmit={handleVerifyOTP}>
                        <div className="auth-form__group">
                            <label className="auth-form__label">Kode OTP</label>
                            <input
                                className="auth-form__input auth-form__input--otp"
                                type="text"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                            />
                            <p className="auth-form__hint">Cek inbox email kamu. Kode berlaku 5 menit.</p>
                        </div>
                        <button className="auth-form__submit" type="submit" disabled={loading || otp.length !== 6}>
                            {loading ? 'Memverifikasi...' : 'Verifikasi'}
                        </button>
                        <button type="button" className="auth-form__link-btn" onClick={() => { setStep(STEPS.EMAIL); setOtp(''); setError(''); }}>
                            Kirim ulang OTP
                        </button>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === STEPS.PASSWORD && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <div className="auth-form__group">
                            <label className="auth-form__label">Password Baru</label>
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
                        <div className="auth-form__group">
                            <label className="auth-form__label">Konfirmasi Password</label>
                            <input
                                className="auth-form__input"
                                type="password"
                                placeholder="Ulangi password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <button className="auth-form__submit" type="submit" disabled={loading}>
                            {loading ? 'Mereset...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {/* Step 4: Done */}
                {step === STEPS.DONE && (
                    <div className="auth-form">
                        <div className="auth-form__success">
                            ✅ Password berhasil direset. Silakan login dengan password baru.
                        </div>
                        <button className="auth-form__submit" onClick={() => navigate('/login')}>
                            Ke Halaman Login
                        </button>
                    </div>
                )}

                {step !== STEPS.DONE && (
                    <div className="auth-footer">
                        Ingat password? <Link to="/login">Masuk</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
