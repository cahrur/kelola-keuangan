import { Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PolicyPage.css';

export default function DeleteAccountPolicyPage() {
    return (
        <div className="policy-page">
            <div className="policy-header">
                <Link to="/about" className="policy-back">
                    <ArrowLeft size={20} />
                </Link>
                <Trash2 size={20} className="policy-header__icon" />
                <h1>Kebijakan Penghapusan Akun</h1>
            </div>

            <div className="policy-content">
                <p className="policy-updated">Terakhir diperbarui: 1 Maret 2026</p>

                <section className="policy-section">
                    <h2>1. Hak Penghapusan</h2>
                    <p>Setiap pengguna Kelola Keuangan berhak untuk meminta penghapusan akun dan seluruh data yang terkait kapan saja, tanpa syarat tambahan.</p>
                </section>

                <section className="policy-section">
                    <h2>2. Data yang Akan Dihapus</h2>
                    <p>Setelah permintaan diproses, data berikut akan <strong>dihapus secara permanen</strong>:</p>
                    <ul>
                        <li>Informasi akun (nama, email, telepon)</li>
                        <li>Seluruh transaksi pemasukan dan pengeluaran</li>
                        <li>Data kantong (wallet)</li>
                        <li>Data kategori kustom</li>
                        <li>Data anggaran (budget)</li>
                        <li>Data hutang dan piutang</li>
                        <li>Data tanggungan / kewajiban</li>
                        <li>Riwayat chat AI dan konfigurasi AI</li>
                        <li>Cache insight AI</li>
                        <li>Session login dan refresh token</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>3. Proses Penghapusan</h2>
                    <ul>
                        <li>Penghapusan diproses dalam <strong>maksimal 7 hari kerja</strong> setelah permintaan diterima.</li>
                        <li>Anda akan menerima konfirmasi via email setelah penghapusan selesai.</li>
                        <li>Setelah dihapus, data <strong>tidak dapat dipulihkan</strong>.</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. Cara Mengajukan Permintaan</h2>
                    <p>Anda dapat mengajukan permintaan penghapusan akun melalui:</p>
                    <ul>
                        <li>
                            <strong>Formulir permintaan:</strong>{' '}
                            <Link to="/delete-account">Ajukan Permintaan Hapus Akun</Link>
                        </li>
                        <li>
                            <strong>Email:</strong>{' '}
                            <a href="mailto:admin@mudahdeal.com">admin@mudahdeal.com</a> dengan subjek "Hapus Akun"
                        </li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>5. Kontak</h2>
                    <p>Untuk pertanyaan lebih lanjut, hubungi kami di:</p>
                    <p><a href="mailto:admin@mudahdeal.com">admin@mudahdeal.com</a></p>
                </section>

                <p className="policy-footer">© {new Date().getFullYear()} DealTech — PT MUDAHDEAL DIGITAL GRUP</p>
            </div>
        </div>
    );
}
