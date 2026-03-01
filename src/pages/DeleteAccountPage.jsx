import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Send, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import './PolicyPage.css';

export default function DeleteAccountPage() {
    const user = useAuthStore((s) => s.user);
    const [email, setEmail] = useState(user?.email || '');
    const [reason, setReason] = useState('');
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return setError('Email wajib diisi.');
        if (!confirm) return setError('Anda harus mencentang konfirmasi.');

        setLoading(true);
        setError('');

        try {
            // Send deletion request via mailto (no backend endpoint needed)
            const subject = encodeURIComponent('Permintaan Hapus Akun - Kelola Keuangan');
            const body = encodeURIComponent(
                `Permintaan Hapus Akun\n\nEmail: ${email}\nAlasan: ${reason || 'Tidak disebutkan'}\n\nSaya mengonfirmasi bahwa saya memahami semua data akan dihapus secara permanen.`
            );
            window.location.href = `mailto:admin@mudahdeal.com?subject=${subject}&body=${body}`;

            // Show success after a short delay
            setTimeout(() => {
                setSubmitted(true);
                setLoading(false);
            }, 1000);
        } catch {
            setError('Gagal mengirim permintaan. Silakan coba lagi.');
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="policy-page">
                <div className="policy-header">
                    <Link to="/about" className="policy-back">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1>Permintaan Terkirim</h1>
                </div>
                <div className="policy-content">
                    <div className="delete-success">
                        <div className="delete-success__icon">
                            <CheckCircle size={48} />
                        </div>
                        <h2>Permintaan Diterima</h2>
                        <p>Permintaan penghapusan akun Anda telah dikirim ke tim support.</p>
                        <p>Kami akan memproses dalam <strong>maksimal 7 hari kerja</strong> dan mengirim konfirmasi ke email Anda.</p>
                        <Link to="/about" className="delete-back-link">Kembali ke Tentang</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="policy-page">
            <div className="policy-header">
                <Link to="/delete-account-policy" className="policy-back">
                    <ArrowLeft size={20} />
                </Link>
                <h1>Hapus Akun</h1>
            </div>

            <div className="policy-content">
                <div className="delete-warning">
                    <AlertTriangle size={20} />
                    <div>
                        <strong>Perhatian!</strong>
                        <p>Penghapusan akun bersifat permanen. Semua data keuangan, riwayat chat AI, dan informasi akun akan dihapus dan tidak dapat dipulihkan.</p>
                    </div>
                </div>

                <form className="delete-form" onSubmit={handleSubmit}>
                    <div className="delete-form__group">
                        <label htmlFor="delete-email">Email Akun</label>
                        <input
                            id="delete-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@contoh.com"
                            required
                        />
                    </div>

                    <div className="delete-form__group">
                        <label htmlFor="delete-reason">Alasan Penghapusan (opsional)</label>
                        <textarea
                            id="delete-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Beri tahu kami alasan Anda..."
                            rows={3}
                        />
                    </div>

                    <label className="delete-form__confirm">
                        <input
                            type="checkbox"
                            checked={confirm}
                            onChange={(e) => setConfirm(e.target.checked)}
                        />
                        <span>Saya memahami bahwa <strong>semua data akan dihapus secara permanen</strong> dan tidak dapat dipulihkan.</span>
                    </label>

                    {error && <p className="delete-form__error">{error}</p>}

                    <button
                        type="submit"
                        className="delete-form__submit"
                        disabled={loading || !confirm}
                    >
                        {loading ? (
                            <><Loader2 size={16} className="spin" /> Mengirim...</>
                        ) : (
                            <><Send size={16} /> Kirim Permintaan Hapus Akun</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
