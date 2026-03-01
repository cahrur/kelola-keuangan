import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PolicyPage.css';

export default function PrivacyPolicyPage() {
    return (
        <div className="policy-page">
            <div className="policy-header">
                <Link to="/about" className="policy-back">
                    <ArrowLeft size={20} />
                </Link>
                <Shield size={20} className="policy-header__icon" />
                <h1>Kebijakan Privasi</h1>
            </div>

            <div className="policy-content">
                <p className="policy-updated">Terakhir diperbarui: 1 Maret 2026</p>

                <section className="policy-section">
                    <h2>1. Informasi yang Kami Kumpulkan</h2>
                    <p>Saat menggunakan Kelola Keuangan, kami mengumpulkan informasi berikut:</p>
                    <ul>
                        <li><strong>Data akun:</strong> Nama, email, dan nomor telepon saat mendaftar.</li>
                        <li><strong>Data keuangan:</strong> Transaksi, kantong, kategori, anggaran, hutang, dan tanggungan yang Anda catat.</li>
                        <li><strong>Data penggunaan:</strong> Interaksi dengan fitur AI untuk memberikan insight yang relevan.</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>2. Penggunaan Informasi</h2>
                    <p>Data Anda digunakan untuk:</p>
                    <ul>
                        <li>Menyediakan layanan pencatatan dan analisis keuangan.</li>
                        <li>Menghasilkan insight keuangan melalui fitur AI.</li>
                        <li>Meningkatkan kualitas dan performa aplikasi.</li>
                        <li>Mengirim notifikasi terkait layanan (jika diaktifkan).</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>3. Penyimpanan & Keamanan Data</h2>
                    <ul>
                        <li>Data disimpan di server yang terenkripsi dan terlindungi.</li>
                        <li>Akses ke data Anda dilindungi oleh autentikasi JWT.</li>
                        <li>Password di-hash menggunakan bcrypt, tidak pernah disimpan dalam bentuk teks biasa.</li>
                        <li>Refresh token disimpan dalam httpOnly secure cookie.</li>
                        <li>API key AI yang Anda simpan <strong>dienkripsi</strong> di server sebelum disimpan ke database, sehingga tidak dapat dibaca secara langsung.</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. Berbagi Data</h2>
                    <p>Kami <strong>tidak menjual, menyewakan, atau membagikan</strong> data pribadi Anda kepada pihak ketiga, kecuali:</p>
                    <ul>
                        <li>Diperlukan oleh hukum atau peraturan yang berlaku.</li>
                        <li>Untuk memproses fitur AI melalui penyedia layanan API (data dikirim tanpa identitas pribadi).</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>5. Hak Pengguna</h2>
                    <p>Anda berhak untuk:</p>
                    <ul>
                        <li>Mengakses dan mengunduh data Anda.</li>
                        <li>Memperbarui informasi akun kapan saja.</li>
                        <li><strong>Menghapus akun dan seluruh data</strong> — lihat <Link to="/delete-account-policy">Kebijakan Penghapusan Akun</Link>.</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>6. Kontak</h2>
                    <p>Untuk pertanyaan tentang kebijakan privasi ini, hubungi kami di:</p>
                    <p><a href="mailto:admin@mudahdeal.com">admin@mudahdeal.com</a></p>
                </section>

                <p className="policy-footer">© {new Date().getFullYear()} DealTech — PT MUDAHDEAL DIGITAL GRUP</p>
            </div>
        </div>
    );
}
