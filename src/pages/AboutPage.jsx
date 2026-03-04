import { Building2, Mail, Sparkles, Wallet, PieChart, Bot, Shield, BarChart3, Globe, Code2, ArrowRight, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import logoImg from '../assets/logo.webp';
import './AboutPage.css';

const APP_VERSION = '1.0.0';

const FEATURES = [
    { icon: Wallet, title: 'Multi Kantong', desc: 'Kelola saldo di berbagai kantong terpisah' },
    { icon: PieChart, title: 'Anggaran Pintar', desc: 'Budget otomatis per kategori tiap bulan' },
    { icon: Bot, title: 'AI Assistant', desc: 'Insight & chat keuangan berbasis AI' },
    { icon: BarChart3, title: 'Laporan Lengkap', desc: 'Grafik tren dan analisis mendalam' },
    { icon: Shield, title: 'Hutang & Piutang', desc: 'Catat dan lacak hutang piutangmu' },
    { icon: Globe, title: 'Tanggungan', desc: 'Kelola tagihan & kewajiban rutin' },
];

export default function AboutPage() {
    return (
        <div className="page-container">
            <PageHeader title="Tentang" />

            {/* App Identity */}
            <div className="about-hero animate-slide-up">
                <img src={logoImg} alt="Kelola Keuangan" className="about-hero__logo" />
                <h2 className="about-hero__name">Kelola Keuangan</h2>
                <span className="about-hero__version">v{APP_VERSION}</span>
                <p className="about-hero__tagline">Atur keuanganmu dengan mudah, cerdas, dan aman.</p>
            </div>

            {/* Company */}
            <Card className="about-section animate-slide-up">
                <div className="about-section__icon-row">
                    <Building2 size={18} />
                    <h3>Dikembangkan oleh</h3>
                </div>
                <div className="about-company">
                    <p className="about-company__name">DealTech</p>
                    <p className="about-company__legal">PT MUDAHDEAL DIGITAL GRUP</p>
                    <a
                        href="https://tech.mudahdeal.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-company__link"
                    >
                        tech.mudahdeal.com <ExternalLink size={12} />
                    </a>
                </div>
            </Card>

            {/* Features */}
            <Card className="about-section animate-slide-up">
                <div className="about-section__icon-row">
                    <Sparkles size={18} />
                    <h3>Fitur Unggulan</h3>
                </div>
                <div className="about-features">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="about-feature">
                            <div className="about-feature__icon">
                                <f.icon size={16} />
                            </div>
                            <div>
                                <p className="about-feature__title">{f.title}</p>
                                <p className="about-feature__desc">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Contact Support */}
            <Card className="about-section animate-slide-up">
                <div className="about-section__icon-row">
                    <Mail size={18} />
                    <h3>Kontak Support</h3>
                </div>
                <p className="about-support__text">
                    Ada pertanyaan, saran, atau kendala? Hubungi tim support kami:
                </p>
                <a href="mailto:admin@mudahdeal.com" className="about-support__email">
                    <Mail size={14} />
                    admin@mudahdeal.com
                </a>
            </Card>

            {/* Promo CTA */}
            <div className="about-promo animate-slide-up">
                <div className="about-promo__icon">
                    <Code2 size={24} />
                </div>
                <h3 className="about-promo__title">Butuh Website atau Aplikasi?</h3>
                <p className="about-promo__text">
                    Kami membangun solusi digital untuk bisnis Anda — website, aplikasi mobile, sistem manajemen, dan lainnya.
                </p>
                <a
                    href="https://tech.mudahdeal.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-promo__cta"
                >
                    Hubungi Kami <ArrowRight size={16} />
                </a>
            </div>

            {/* Policy Links */}
            <Card className="about-section animate-slide-up">
                <div className="about-section__icon-row">
                    <FileText size={18} />
                    <h3>Kebijakan</h3>
                </div>
                <div className="about-policies">
                    <Link to="/privacy" className="about-policy-link">
                        <FileText size={16} />
                        <span>Kebijakan Privasi</span>
                        <ArrowRight size={14} />
                    </Link>
                    <Link to="/delete-account-policy" className="about-policy-link about-policy-link--danger">
                        <Trash2 size={16} />
                        <span>Kebijakan Penghapusan Akun</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </Card>

            <p className="about-footer">
                © {new Date().getFullYear()} DealTech — PT MUDAHDEAL DIGITAL GRUP
            </p>
        </div>
    );
}
